import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const magicDesignSchema = z.object({
  pageTitle: z.string(),
  background: z.string().describe('Hex color like #FAF6F0 or #0F172A'),
  kicker: z.string().describe('Short uppercase eyebrow tag, 2 to 4 words'),
  kickerBg: z.string().describe('Hex color for kicker pill background'),
  kickerColor: z.string().describe('Hex color for kicker text with high contrast'),
  headline: z.string().describe('Punchy display headline, 2 to 6 words'),
  headlineFont: z.enum(['playfair', 'space', 'syne', 'jakarta']),
  headlineColor: z.string().describe('High contrast hex color against background'),
  subheadline: z
    .string()
    .describe('Supporting editorial copy, 10 to 20 words'),
  subheadlineColor: z.string().describe('Readable hex color against background'),
  ctaText: z.string().describe('Action badge or footer line, 2 to 5 words'),
  accentColor: z.string().describe('Vibrant accent hex color'),
  secondaryShapeColor: z.string().describe('Complementary shape hex color'),
  layoutStyle: z.enum(['editorial-centered', 'poster-bold', 'split-modern']),
})

const magicRewriteSchema = z.object({
  variations: z
    .array(
      z.object({
        label: z.string(),
        text: z.string(),
      })
    )
    .min(3)
    .max(4),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mode = body?.mode

    if (mode === 'rewrite') {
      const text = String(body?.text || '').trim()
      const tone = String(body?.tone || 'editorial')
      if (!text) {
        return NextResponse.json(
          { error: 'Please select or enter text to rewrite.' },
          { status: 400 }
        )
      }

      const result = await generateText({
        model: 'openai/gpt-5.4-mini',
        output: Output.object({ schema: magicRewriteSchema }),
        prompt: `You are an expert brand copywriter inside a Canva-style visual design studio.
Rewrite the following canvas text in a "${tone}" tone. Keep lengths concise and visually balanced for graphic design layouts.
Original text: "${text}"
Return 3 distinct variations with short descriptive labels.`,
      })

      return NextResponse.json({ variations: result.output.variations })
    }

    const prompt = String(body?.prompt || '').trim()
    if (!prompt) {
      return NextResponse.json(
        { error: 'Describe the design you want to generate.' },
        { status: 400 }
      )
    }

    const result = await generateText({
      model: 'openai/gpt-5.4-mini',
      output: Output.object({ schema: magicDesignSchema }),
      prompt: `You are an award-winning art director creating a graphic design layout in a Canva-style visual editor.
User brief: "${prompt}"

Design a cohesive, high-contrast, modern graphic layout:
- Ensure strong WCAG contrast between background and headlineColor/subheadlineColor.
- Pick a font matching the vibe: "playfair" for luxury/editorial/food/fashion, "space" for tech/SaaS/modern, "syne" for music/events/posters, "jakarta" for clean brand/promo.
- Keep headline concise and impactful (2-6 words).`,
    })

    return NextResponse.json({ design: result.output })
  } catch (error) {
    console.error('[v0] Magic AI route error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to generate AI design right now.',
      },
      { status: 500 }
    )
  }
}
