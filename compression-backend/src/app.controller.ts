import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import type { Response } from 'express';
import type { FileFilterCallback } from 'multer';

const ALLOWED_MIMETYPES = [
  'image/gif',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const SEPARATOR = '---IMAGE--SEPARATOR---';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      fileFilter(
        _req: Express.Request,
        file: Express.Multer.File,
        cb: FileFilterCallback,
      ) {
        if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只允许上传图片文件（gif/png/jpg/webp）'));
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('上传失败');
    return file.path;
  }
  @Get('compression')
  async compression(
    @Query('fileList') fileList: string,
    @Query('color') coloursStr: string,
    @Query('level') effortStr: string,
    @Res() res: Response,
  ) {
    const Files = JSON.parse(fileList);
    if (!Files.length) throw new BadRequestException('无文件');

    const color = parseInt(coloursStr, 10);
    const level = parseInt(effortStr, 10);

    // 先设置响应头，只设置一次
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
      for (const file of Files) {
        const ext = file.extname.toLowerCase();
        const image = sharp(file.filePath, {
          animated: true, //读取所有的帧,支持gif压缩
          limitInputPixels: false, //不限制大小
        });
        let buffer: Buffer;

        switch (ext) {
          case 'gif':
            buffer = await image
              .gif({ effort: level, colours: color })
              .toBuffer();
            break;
          case 'png':
            buffer = await image
              .png({ compressionLevel: level, colours: color })
              .toBuffer();
            break;
          default:
            // jpeg quality 范围 1-100
            buffer = await image
              .jpeg({ quality: Math.min(Math.max(level, 1), 100) })
              .toBuffer();
        }

        res.write(buffer);
        res.write(SEPARATOR);
      }
      res.end();
    } catch (e) {
      if (!res.headersSent) {
        throw new BadRequestException('压缩失败');
      }
    }
  }
}
