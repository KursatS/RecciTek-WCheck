import { net } from 'electron';
import { JSDOM } from 'jsdom';

export interface WarrantyInfo {
  serial: string;
  warranty_status: string;
  model_name: string;
  model_color: string;
  warranty_end?: string;
}

export async function checkWarranty(serial: string): Promise<WarrantyInfo> {

  function makeRequest(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = net.request(url);
      request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      request.setHeader('Accept-Charset', 'utf-8');

      request.on('response', (response) => {
        let buffers: Buffer[] = [];
        response.on('data', (chunk) => {
          buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on('end', () => {
          try {
            const fullBuffer = Buffer.concat(buffers);
            const data = fullBuffer.toString('utf8');
            const cleanData = data.replace(/�/g, '').replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            resolve(cleanData);
          } catch (error) {
            reject(error);
          }
        });
      });
      request.on('error', (error) => {
        reject(error);
      });
      request.end();
    });
  }

  try {
    const html = await makeRequest(`https://garantibelgesi.recciteknoloji.com/sorgu/${serial}`);

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const body = document.body;

    if (body && body.textContent.includes('Ürün Resmi Roborock Türkiye Garanti Kapsamındadır.')) {
      const modelElement = document.querySelector('html > body > div > div:nth-child(3) > div > div:nth-child(2) > a > h3');
      let modelInfo = modelElement ? modelElement.textContent.trim() : '';

      if (!modelInfo) {
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
          const text = element.textContent.trim();
          if (text.includes('ROBOROCK') && (text.includes('BEYAZ') || text.includes('SİYAH'))) {
            modelInfo = text;
            break;
          }
        }
      }

      let model_name = 'Model Bulunamadı';
      let model_color = 'Renk Bulunamadı';

      if (modelInfo) {
        modelInfo = modelInfo.replace(/\s+/g, ' ').trim();

        if (modelInfo.includes('ROBOROCK') && (modelInfo.includes('BEYAZ') || modelInfo.includes('SİYAH'))) {
          const parts = modelInfo.split(' ');
          if (parts.length >= 3) {
            model_name = parts.slice(1, -1).join(' ').trim();
            model_color = parts[parts.length - 1].trim();
          }
        } else {
          model_name = modelInfo.trim();
        }

        model_name = model_name.toUpperCase();
        if (model_name.includes('QREVO')) {
          model_name = model_name.replace('QREVO', 'Q REVO');
        }
        model_name = model_name.replace(/SON[Iİ]C/g, '').trim();
      }


      return {
        serial,
        warranty_status: 'RECCI GARANTILI',
        model_name,
        model_color
      };
    } else if (body && body.textContent.includes('Bu ürün Roborock Türkiye Garanti kapsamında değildir!')) {
    }
  } catch (error) {
  }

  try {
    const json = await makeRequest(`https://guvencesorgula.kvkteknikservis.com/api/device-data?imeiNo=${serial}`);

    const data = JSON.parse(json) as any;

    if (data.IsSucceeded && data.ResultData && Array.isArray(data.ResultData) && data.ResultData.length > 0 && data.ResultData[0] !== 'No data found') {
      const deviceData = data.ResultData[0];
      const description = deviceData.DESCRIPTION || '';

      let model_name = '';
      let model_color = '';

      if (description.includes('Roborock')) {
        const parts = description.split(' ');
        if (parts.length >= 4) {
          model_name = parts.slice(1, -1).join(' ').trim();
          model_color = parts[parts.length - 1].trim();
        }
      } else {
        model_name = description;
      }

      model_name = model_name.toUpperCase();
      if (model_name.includes('QREVO')) {
        model_name = model_name.replace('QREVO', 'Q REVO');
      }

      return {
        serial,
        warranty_status: 'KVK GARANTILI',
        model_name,
        model_color,
        warranty_end: deviceData.WARRANTYEND
      };
    }
  } catch (error) {
  }

  return {
    serial,
    warranty_status: 'GARANTI KAPSAMI DISINDA',
    model_name: '',
    model_color: ''
  };
}