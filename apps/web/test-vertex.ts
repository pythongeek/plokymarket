import { VertexAI } from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

async function test() {
    const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
    const decodedKey = Buffer.from(base64Key || '', 'base64').toString('utf-8');
    const credentials = JSON.parse(decodedKey);
    if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const vertexai = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT,
        location: process.env.VERTEX_LOCATION || 'us-central1',
        googleAuthOptions: { credentials }
    });

    console.log('Testing gemini-1.5-flash-002...');
    try {
        const model = vertexai.getGenerativeModel({ model: 'gemini-1.5-flash-002' });
        const resp = await model.generateContent('Say hello');
        console.log(resp.response.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e: any) { console.error('Error with gemini-1.5-flash-002:', e.message); }

    console.log('Testing gemini-2.0-flash-001...');
    try {
        const model = vertexai.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
        const resp = await model.generateContent('Say hello');
        console.log(resp.response.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e: any) { console.error('Error with gemini-2.0-flash-001:', e.message); }

    console.log('Testing gemini-2.5-flash...');
    try {
        const model = vertexai.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const resp = await model.generateContent('Say hello');
        console.log(resp.response.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e: any) { console.error('Error with gemini-2.5-flash:', e.message); }
}

test();
