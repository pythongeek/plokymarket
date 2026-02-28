const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'old_page_utf8.tsx');
const destPath = path.join(__dirname, 'page.tsx');

let content = fs.readFileSync(pagePath, 'utf8');

// 1. Imports
content = content.replace(
    `import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Loader2, Eye, Save,`,
    `import { BUILT_IN_CATEGORIES, slugifyCategory } from '@/lib/config/categories';
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Loader2, Eye, Save,`
);

// 2. FormData interface
content = content.replace(
    `  slug: string;
}`,
    `  slug: string;
  customCategory: string;
}`
);

// 3. Form state initial value & custom categories state
content = content.replace(
    `    isFeatured: false,
    slug: '',
  });`,
    `    isFeatured: false,
    slug: '',
    customCategory: '',
  });

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);`
);

// 4. Custom Categories fetch useEffect
content = content.replace(
    `  // Fetch existing events for duplicate detection`,
    `  // Fetch custom categories
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('custom_categories')
      .select('name')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setCustomCategories(data.map((r: any) => r.name));
      });
  }, []);

  // Fetch existing events for duplicate detection`
);

// 5. Category Map logic
content = content.replace(
    `  const selectedCategory = BD_CATEGORIES.find((c) => c.value === form.category);`,
    `  const dynamicCategories = customCategories
    .filter(c => !BD_CATEGORIES.some(bd => bd.value === slugifyCategory(c)))
    .map(c => ({
      value: slugifyCategory(c),
      label: c,
      icon: '📌',
      color: 'bg-gray-50 border-gray-200 text-gray-700',
      subcategories: [],
    }));

  const displayCategories = [...BD_CATEGORIES, ...dynamicCategories];

  const effectiveCategory = showCustomCategory ? form.customCategory.trim() : form.category;
  const selectedCategory = displayCategories.find((c) => c.value === form.category);`
);

// 6. handleSubmit payload & saving custom category
const newSubmitPayload = `
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload = {
        event_data: {
          title: form.title.trim() || form.question.trim(),
          question: form.question.trim(),
          description: form.description.trim() || null,
          category: effectiveCategory,
          subcategory: form.subcategory || null,
          tags: form.tags,
          slug: form.slug,
          image_url: form.imageUrl.trim() || null,
          trading_closes_at: new Date(form.tradingClosesAt).toISOString(),
          resolution_delay_hours: form.resolutionDelayHours,
          initial_liquidity: form.initialLiquidity,
          answer_type: 'binary',
          answer1: form.answer1,
          answer2: form.answer2,
          is_featured: form.isFeatured,
          resolution_method: form.resolutionMethod,
          ai_keywords: form.aiKeywords,
          ai_sources: form.aiSources,
          ai_confidence_threshold: form.confidenceThreshold,
          status: 'active' as EventStatus,
        },
        resolution_config: {
          primary_method: form.resolutionMethod,
          confidence_threshold: form.confidenceThreshold,
          ai_keywords: form.aiKeywords,
          ai_sources: form.aiSources,
        }
      };

      const response = await fetch('/api/admin/events/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': \`Bearer \${session.access_token}\` } : {})
        },
        body: JSON.stringify(payload),
      });
`;
content = content.replace(
    /      const payload = \{[\s\S]*?body: JSON\.stringify\(payload\),\n      \}\);/,
    newSubmitPayload
);

content = content.replace(
    `      toast.success('✨ ইভেন্ট সফলভাবে তৈরি হয়েছে!');
    } catch (err: any) {`,
    `      toast.success('✨ ইভেন্ট সফলভাবে তৈরি হয়েছে!');

      // save custom category if new
      if (showCustomCategory && form.customCategory.trim()) {
        await supabase.from('custom_categories').insert({
          name: form.customCategory.trim(),
          slug: slugifyCategory(form.customCategory.trim()),
          is_active: true,
          display_order: 999,
        }).then(() => {});
      }
    } catch (err: any) {`
);

// 7. validateStep
content = content.replace(
    `    if (s === 2) {
      if (!form.category) e.category = 'ক্যাটাগরি নির্বাচন করুন';
    }`,
    `    if (s === 2) {
      if (showCustomCategory) {
        if (!form.customCategory.trim()) e.customCategory = 'কাস্টম ক্যাটাগরির নাম লিখুন';
      } else {
        if (!form.category) e.category = 'ক্যাটাগরি নির্বাচন করুন';
      }
    }`
);

// 8. JSX Category Loop
content = content.replace(
    `                {BD_CATEGORIES.map((cat) => (`,
    `                {displayCategories.map((cat) => (`
);
content = content.replace(
    /onClick=\{\(\) => \{ set\('category', cat\.value\); set\('subcategory', ''\); \}\}/g,
    `onClick={() => { set('category', cat.value); set('subcategory', ''); setShowCustomCategory(false); }}`
);

// Add the + Custom button inside the grid
content = content.replace(
    `                  </button>
                ))}
              </div>
              {errors.category`,
    `                  </button>
                ))}
                
                <button
                  onClick={() => { set('category', ''); setShowCustomCategory(true); }}
                  className={\`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center justify-center \${
                    showCustomCategory
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-offset-1'
                      : 'bg-white border-dashed border-gray-300 hover:border-gray-400 text-gray-500'
                  }\`}
                >
                  <Plus className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">+ Custom</span>
                </button>
              </div>

              {showCustomCategory && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.customCategory}
                    onChange={(e) => set('customCategory', e.target.value)}
                    placeholder="e.g. Esports, Local News"
                    className={\`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 \${
                      errors.customCategory ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }\`}
                  />
                  {errors.customCategory && <p className="text-xs text-red-500 mt-1">{errors.customCategory}</p>}
                </div>
              )}
              {errors.category && !showCustomCategory`
);

fs.writeFileSync(destPath, content);
console.log('Successfully patched page.tsx');
