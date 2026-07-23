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

      // Set timeout to 7 seconds
      const timeout = setTimeout(() => {
        request.abort();
        reject(new Error('Request timeout'));
      }, 7000);

      request.on('response', (response) => {
        clearTimeout(timeout);

        if (response.statusCode !== 200) {
          request.abort();
          reject(new Error(`HTTP Error: ${response.statusCode}`));
          return;
        }

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
        clearTimeout(timeout);
        reject(error);
      });
      request.end();
    });
  }

  try {
    const html = await makeRequest(`https://www.recciteknoloji.com/garantibelgesi2/?q=${serial}`);

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const window = dom.window;

    const getByXPath = (xpath: string): string => {
      try {
        const res = document.evaluate(xpath, document, null, window.XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return res.singleNodeValue ? res.singleNodeValue.textContent.trim() : '';
      } catch (e) {
        return '';
      }
    };

    const rawModel = getByXPath('/html/body/main/div/div[1]/div[2]/div[2]');
    const rawColor = getByXPath('/html/body/main/div/div[1]/div[3]/div[2]');
    const rawStatus = getByXPath('/html/body/main/div/div[4]');

    const isGarantili = rawStatus.toUpperCase().includes('GARANTİ KAPSAMINDADIR') || 
                        rawStatus.toUpperCase().includes('GARANTI KAPSAMINDADIR') ||
                        document.body.textContent.includes('Garanti Kapsamındadır');

    if (isGarantili && rawModel) {
      let model_name = rawModel.toUpperCase().trim()
        .replace(/^(MODEL|MARKA)\s*:\s*/i, '')
        .replace(/^(MODEL|MARKA)\s*/i, '')
        .trim();

      let model_color = rawColor.toUpperCase().trim()
        .replace(/^RENK\s*:\s*/i, '')
        .replace(/^RENK\s*/i, '')
        .trim();

      if (model_name.includes('QREVO')) {
        model_name = model_name.replace('QREVO', 'Q REVO');
      }
      if (model_name.includes('S8')) {
        model_name = model_name.replace(/SON[Iİ]C/g, '').trim();
      }

      return {
        serial,
        warranty_status: 'RECCI GARANTILI',
        model_name,
        model_color
      };
    }
  } catch (error: any) {
    if (error.message && error.message.includes('HTTP Error:')) {
      // Allow fallback if primary server has an HTTP error (e.g. 500)
    } else {
      // Any error from the first API (timeout or connection error) should be treated as timeout
      // because the second API will also fail with the same connection issue
      throw new Error('TIMEOUT');
    }
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
      if (model_name.includes('S8')) {
        model_name = model_name.replace(/SON[Iİ]C/g, '').trim();
      }

      return {
        serial,
        warranty_status: 'KVK GARANTILI',
        model_name,
        model_color,
        warranty_end: deviceData.WARRANTYEND
      };
    }
  } catch (error: any) {
    if (error.message && error.message.includes('HTTP Error:')) {
      // Ignore inner HTTP error 
    } else {
      // Any error from the first API (timeout or connection error) should be treated as timeout
      // because the second API will also fail with the same connection issue
      throw new Error('TIMEOUT');
    }
  }

  return {
    serial,
    warranty_status: 'GARANTI KAPSAMI DISINDA',
    model_name: '',
    model_color: ''
  };
}