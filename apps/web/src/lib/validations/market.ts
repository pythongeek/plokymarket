import * as z from 'zod';

export const marketSchema = z.object({
    name: z.string().min(10, 'শিরোনাম কমপক্ষে ১০ অক্ষর হতে হবে').max(255),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug শুধু ছোট হাতের অক্ষর, সংখ্যা এবং হাইফেন হতে পারে').max(255),
    question: z.string().min(20, 'প্রশ্ন কমপক্ষে ২০ অক্ষর হতে হবে').max(2000),
    category: z.enum(['Sports', 'Politics', 'Crypto', 'Economics', 'Technology', 'Entertainment', 'World Events']),
    answer1: z.string().min(1).max(100).default('Yes'),
    answer2: z.string().min(1).max(100).default('No'),
    startsAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "সঠিক তারিখ দিন" }),
    endsAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "সঠিক তারিখ দিন" }),
    resolutionDelay: z.number().int().min(0).max(20160).default(60),
    initialPrice: z.number().min(0.01).max(0.99).default(0.5),
    initialLiquidity: z.number().min(100).default(5000),
    imageUrl: z.string().url('সঠিক URL দিন').optional().or(z.literal('')),
    resolverAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'সঠিক ইথেরিয়াম অ্যাড্রেস দিন'),
    description: z.string().max(5000).optional(),
    negRisk: z.boolean().default(false),
});

export type MarketFormData = z.infer<typeof marketSchema>;
