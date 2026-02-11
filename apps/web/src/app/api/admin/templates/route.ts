import { NextRequest, NextResponse } from 'next/server';
import { BUILT_IN_TEMPLATES, generateFromTemplate } from '@/lib/market-creation/template-engine';

/**
 * GET /api/admin/templates - List all built-in templates
 */
export async function GET() {
    // Return templates without the generate function (not serializable)
    const templates = BUILT_IN_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        nameBn: t.nameBn,
        description: t.description,
        icon: t.icon,
        type: t.type,
        category: t.category,
        parameters: t.parameters,
    }));

    return NextResponse.json({ data: templates });
}

/**
 * POST /api/admin/templates - Generate market data from template
 * Body: { templateId: string, params: Record<string, any> }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { templateId, params } = body;

        if (!templateId) {
            return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
        }

        const generated = generateFromTemplate(templateId, params || {});
        return NextResponse.json({ data: generated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to generate market' }, { status: 400 });
    }
}
