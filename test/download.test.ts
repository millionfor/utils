import { download, DownloadOptions } from './../src';
import { Request } from './../src/node/request';
import { fs } from './../src/node/fs-system';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

jest.mock('./../src/node/fs-system');
jest.mock('./../src/node/request');

describe('download', () => {
  const mockUrl = 'https://example.com/file.txt';
  const mockFilePath = resolve(tmpdir(), 'file.txt');
  const mockContent = 'Hello, World!';
  const mockContentLength = mockContent.length;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should download a file successfully', async () => {
    const mockRequest = new Request('', {});
    (Request as any).mockImplementation(() => mockRequest);
    (mockRequest.req as jest.Mock).mockResolvedValueOnce({
      req: { path: '/file.txt', getHeader: () => null },
      res: {
        headers: { 'content-length': mockContentLength },
        destroy: jest.fn(),
      },
    }).mockResolvedValueOnce({
      res: {
        headers: { 'content-length': mockContentLength },
        on: (event: string, callback: (buf?: Buffer) => void) => {
          if (event === 'data') callback(Buffer.from(mockContent));
          if (event === 'end') callback();
        },
      },
    });

    const options: DownloadOptions = {
      url: mockUrl,
      filepath: mockFilePath,
    };

    const result = await download(options);

    expect(result.filepath).toBe(mockFilePath);
    expect(result.size).toBe(mockContentLength);
    expect(result.isExist).toBe(false);
    expect(fs.writeFileSync).toHaveBeenCalledWith(mockFilePath, Buffer.from(mockContent));
  });

  it('should not download if file already exists', async () => {
    const mockRequest = new Request('', {});
    (Request as any).mockImplementation(() => mockRequest);
    (mockRequest.req as jest.Mock).mockResolvedValueOnce({
      req: { path: '/file.txt', getHeader: () => null },
      res: {
        headers: { 'content-length': mockContentLength },
        destroy: jest.fn(),
      },
    });

    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    (fs.statSync as jest.Mock).mockReturnValueOnce({ isFile: () => true, size: mockContentLength });

    const options: DownloadOptions = {
      url: mockUrl,
      filepath: mockFilePath,
    };

    const result = await download(options);

    expect(result.filepath).toBe(mockFilePath);
    expect(result.size).toBe(mockContentLength);
    expect(result.isExist).toBe(true);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should download large file in segments', async () => {
    const mockRequest = new Request('', {});
    (Request as any).mockImplementation(() => mockRequest);
    (mockRequest.req as jest.Mock).mockResolvedValueOnce({
      req: { path: '/file.txt', getHeader: () => null },
      res: {
        headers: { 'content-length': mockContentLength, 'accept-ranges': 'bytes' },
        destroy: jest.fn(),
      },
    }).mockResolvedValue({
      res: {
        headers: { 'content-length': mockContentLength },
        on: (event: string, callback: (buf?: Buffer) => void) => {
          if (event === 'data') callback(Buffer.from(mockContent));
          if (event === 'end') callback();
        },
      },
    });

    const options: DownloadOptions = {
      url: mockUrl,
      filepath: mockFilePath,
      segmentSize: 10, // 10KB
      paralelism: 2,
    };

    const result = await download(options);

    expect(result.filepath).toBe(mockFilePath);
    expect(result.size).toBe(mockContentLength);
    expect(result.isExist).toBe(false);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
