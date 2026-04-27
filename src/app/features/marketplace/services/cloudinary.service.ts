import { Injectable } from '@angular/core';

declare var cloudinary: any;

@Injectable({ providedIn: 'root' })
export class CloudinaryService {

  uploadImage(): Promise<string> {
    return new Promise((resolve, reject) => {
      const widget = cloudinary.createUploadWidget(
        {
          cloudName: 'dwsacemju',
          uploadPreset: 'baladna_preset',
          sources: ['local', 'url', 'camera'],
          maxFiles: 1,
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
          maxFileSize: 5000000
        },
        (error: any, result: any) => {
          if (result?.event === 'success') {
            resolve(result.info.secure_url);
          }
          if (error) {
            reject(error);
          }
        }
      );
      widget.open();
    });
  }
}