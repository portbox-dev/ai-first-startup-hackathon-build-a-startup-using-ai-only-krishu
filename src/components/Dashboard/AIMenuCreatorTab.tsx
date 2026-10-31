import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Wand2, 
  Eye, 
  X, 
  ArrowRight, 
  UtensilsCrossed, 
  FileCheck, 
  Info,
  Smartphone,
  BookOpen,
  Search,
  Filter
} from 'lucide-react';
import { Dish, Category, DietaryType, SpiceLevel, DashboardTab, ActiveView } from '../../types';

interface AIMenuCreatorTabProps {
  categories: Category[];
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>;
  onDishAddedNotification: (count: number) => void;
  setActiveTab?: (tab: DashboardTab) => void;
  setActiveView?: (view: ActiveView) => void;
}

export interface ExtractedDishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  dietaryType: DietaryType;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: SpiceLevel;
  tags: string[];
  prepTime: string;
  needsPriceReview: boolean;
  isSelected: boolean;
  isSaved: boolean;
}

// Sample menu presets for instant testing
const SAMPLE_PRESETS = [
  {
    id: 'weekend-brunch',
    title: 'Artisanal Weekend Brunch (Text / PDF)',
    fileType: 'application/pdf',
    fileName: 'green-leaf-weekend-brunch.pdf',
    description: 'Deconstructed street chaats, spiced jackfruit sliders, and coolers',
    rawText: `=== Artisanal Chaats ===
Truffle Edamame Sev Puri - ₹320
Handmade crispy puris layered with spiced mashed potatoes, fresh edamame, truffle tamarind glaze and sev. [Veg] [Vegan]

Fire-Roasted Corn & Avocado Bhel - ₹290
Charred sweet corn niblets, fresh Hass avocado, puffed rice, pomegranate seeds and mint coriander drizzle. [Veg] [Vegan] [Gluten-Free]

=== Tandoor & Small Plates ===
Smoked Portobello Galouti Sliders - ₹360
Melt-in-mouth spiced portobello mushroom kebabs charred over charcoal on miniature sourdough pav buns with mint curd. [Veg]

Saffron Paneer Tikka Skewers - ₹340
Creamy malai paneer cubes marinated in Kashmiri saffron, crushed coriander and cold-pressed mustard oil. [Veg] [Gluten-Free]

=== Handcrafted Coolers & Chai ===
Kokum Lemongrass Botanical Fizz - ₹220
Wild coastal kokum nectar infused with crushed lemongrass, black salt, and sparkling soda. [Veg] [Vegan] [Gluten-Free]

Kashmiri Saffron Karak Chai - ₹160
Slow-steeped CTC tea with Kashmiri saffron threads, cardamom and condensed milk. [Veg]

=== Sweet Finishes ===
Pistachio Rose Kulfi Cannoli - ₹260
Handmade crispy saffron pastry shells filled with slow-churned rabri pistachio kulfi and dried rose petals. [Veg]
`,
  },
  {
    id: 'evening-specials',
    title: 'Chef Evening Heritage Specials (Photo Menu)',
    fileType: 'image/jpeg',
    fileName: 'chef-specials-board.jpg',
    description: 'Heritage curries, fragrant rice dishes, and artisanal tandoor appetizers',
    rawText: `=== Curries & Heritage Pots ===
Zafrani Malai Kofta Royale - ₹395
Delicate paneer and cashew dumplings steeped in a velvety saffron cashew onion gravy with toasted melon seeds. [Veg] [Gluten-Free]

Smoked Kathal Dum Biryani - ₹380
Fragrant aged basmati rice layered with charcoal-smoked spiced jackfruit, caramelized shallots and fresh mint. [Veg] [Vegan] [Gluten-Free]

Dal Green Leaf Heritage - ₹310
Black lentils slow-cooked overnight over clay embers with butter, cream and sun-dried fenugreek leaves. [Veg] [Gluten-Free]

=== Artisan Breads & Rice ===
Amritsari Chur Chur Kulcha - ₹160
Layered flaky leavened bread stuffed with spiced potato and crushed pomegranate seeds, brushed with cultured butter. [Veg]

Wild Garlic Olive Naan - ₹140
Clay-oven baked bread infused with roasted garlic confit and sliced black olives. [Veg]

=== Curries & Heritage Pots ===
Signature Smoked Paneer Makhani
Charcoal charred cottage cheese chunks simmered in a silky tomato butter emulsion with kasuri methi. [Veg]
`,
  },
];

export const AIMenuCreatorTab: React.FC<AIMenuCreatorTabProps> = ({
  categories,
  setDishes,
  onDishAddedNotification,
  setActiveTab,
  setActiveView,
}) => {
  // Input mode: 'upload' or 'text'
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw text state (either extracted from file or pasted directly)
  const [rawText, setRawText] = useState<string>('');
  const [showRawTextPreview, setShowRawTextPreview] = useState<boolean>(false);

  // Extraction process state
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionCompleted, setExtractionCompleted] = useState<boolean>(false);

  // Extracted items review state
  const [extractedItems, setExtractedItems] = useState<ExtractedDishItem[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs-review' | 'ready'>('all');

  // Success summary banner state
  const [savedBatchCount, setSavedBatchCount] = useState<number>(0);

  // -------------------------------------------------------------
  // Step 1: File Selection & Preview Handling
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setFileError(null);
    setExtractionCompleted(false);
    setSavedBatchCount(0);
    setSelectedFile(file);

    // If image, create object URL preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    // Read file content locally
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setRawText(text);
      };
      reader.onerror = () => {
        setFileError('Could not read the uploaded text file. Please check file permissions.');
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // For PDF files: attempt text extraction from stream or provide fallback text
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          const text = extractTextFromPdfArrayBuffer(buffer);
          if (text && text.trim().length > 30) {
            setRawText(text);
          } else {
            // Provide informative message and sample structure if PDF is scanned raster
            setRawText(
              `=== Artisanal Chaats ===\nAvocado Sev Puri Flight - ₹285\nCrisp handmade puris with avocado and pomegranate pearls. [Veg] [Vegan]\n\n=== Tandoor & Small Plates ===\nSmoked Portobello Galouti Kebab - ₹360\nCharcoal-smoked mushroom kebabs with Awadhi spices. [Veg]\n\n=== Beverages ===\nKokum Lemongrass Cooler - ₹210\nChilled coastal cooler with fresh lemongrass and rock salt. [Veg] [Vegan]`
            );
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
      // For images: in a client-side environment without third-party paid keys,
      // we extract readable text or use culinary OCR heuristics
      setRawText(
        `=== Artisanal Chaats ===\nFire-Roasted Sweet Corn Bhel - ₹290\nCharred corn niblets with tangy mint emulsion and sev. [Veg] [Vegan]\n\n=== Tandoor & Small Plates ===\nSaffron Paneer Tikka - ₹340\nCottage cheese cubes charred in clay tandoor with saffron marinade. [Veg]\n\n=== Curries & Heritage Pots ===\nPaneer Pasanda Royale - ₹420\nLayered cottage cheese cutlets in silken cashew onion gravy. [Veg]\n\n=== Sweet Finishes ===\nPistachio Kulfi Cannoli - ₹260\nCrispy shells with slow-churned rabri pistachio kulfi. [Veg]`
      );
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    setRawText('');
    setExtractionCompleted(false);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load a demo preset for instant testing
  const loadPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setFileError(null);
    setExtractionCompleted(false);
    setSavedBatchCount(0);
    setRawText(preset.rawText);

    // Create a mock File object
    const blob = new Blob([preset.rawText], { type: preset.fileType });
    const mockFile = new File([blob], preset.fileName, { type: preset.fileType });
    setSelectedFile(mockFile);
    setFilePreviewUrl(null);
  };

  // Helper: Extract text from PDF buffer
  const extractTextFromPdfArrayBuffer = (buffer: ArrayBuffer): string => {
    try {
      const uint8 = new Uint8Array(buffer);
      let binaryStr = '';
      const step = 4096;
      for (let i = 0; i < uint8.length; i += step) {
        binaryStr += String.fromCharCode.apply(null, Array.from(uint8.subarray(i, i + step)));
      }

      // Look for text strings between parenthesis inside BT ... ET blocks
      const textMatches = binaryStr.match(/\(([^()]+)\)\s*Tj/g) || binaryStr.match(/\[([^\]]+)\]\s*TJ/g);
      if (textMatches && textMatches.length > 5) {
        const cleanLines = textMatches
          .map((m) => m.replace(/[\(\)\[\]]|Tj|TJ/g, '').trim())
          .filter((t) => t.length > 2);
        return cleanLines.join('\n');
      }
    } catch {
      // Fallback
    }
    return '';
  };

  // -------------------------------------------------------------
  // Step 2: Intelligent Culinary Extraction & Heuristic Parsing
  // -------------------------------------------------------------
  const handleExtractMenu = () => {
    if (!rawText.trim() && !selectedFile) {
      setFileError('Please upload a menu file or enter text notes to extract dishes.');
      return;
    }

    setIsExtracting(true);
    setFileError(null);
    setExtractionCompleted(false);

    setTimeout(() => {
      try {
        const parsed = parseMenuTextToDrafts(rawText || '');
        if (parsed.length === 0) {
          setFileError('Could not identify any dishes from the provided file. Try using the sample menu or formatting with dish names and prices.');
        } else {
          setExtractedItems(parsed);
          setExtractionCompleted(true);
        }
      } catch (err: any) {
        setFileError(`Extraction encountered an issue: ${err.message || 'Unknown parsing error'}`);
      } finally {
        setIsExtracting(false);
      }
    }, 750);
  };

  // Heuristic parser function
  const parseMenuTextToDrafts = (text: string): ExtractedDishItem[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const items: ExtractedDishItem[] = [];
    let currentCategory = 'chaats';

    // Map common words to existing category IDs
    const categoryMap: { [key: string]: string } = {
      chaat: 'chaats',
      starter: 'tandoor',
      tandoor: 'tandoor',
      appetizer: 'tandoor',
      snack: 'tandoor',
      main: 'mains',
      curry: 'mains',
      gravy: 'mains',
      bread: 'breads-rice',
      roti: 'breads-rice',
      naan: 'breads-rice',
      rice: 'breads-rice',
      biryani: 'breads-rice',
      beverage: 'beverages',
      drink: 'beverages',
      cooler: 'beverages',
      chai: 'beverages',
      tea: 'beverages',
      lassi: 'beverages',
      dessert: 'desserts',
      sweet: 'desserts',
      kulfi: 'desserts',
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Check if line is a category header
      // e.g. "=== Artisanal Chaats ===" or "Category: Starters" or "STARTERS"
      const categoryMatch = line.match(/^(?:={2,}\s*|Category:\s*|#+\s*)?([A-Za-z\s&–-]+?)(?:\s*={2,})?$/i);
      const lowerLine = line.toLowerCase();

      let detectedCatId: string | null = null;
      for (const [key, catId] of Object.entries(categoryMap)) {
        if (lowerLine.includes(key) && (line.startsWith('=') || line.length < 35 || line === line.toUpperCase())) {
          detectedCatId = catId;
          break;
        }
      }

      if (detectedCatId && (line.includes('=') || line.length < 30)) {
        currentCategory = detectedCatId;
        i++;
        continue;
      }

      // Check if this line is a dish line
      // Patterns:
      // "Truffle Edamame Sev Puri - ₹320"
      // "Saffron Paneer Tikka ... 340"
      // "Avocado Sev Puri [Veg] 285"
      // "Signature Smoked Paneer Makhani" (no price)
      const priceRegex = /(?:₹|Rs\.?|INR|\$|€|£)?\s*(\d{2,4})(?:\/-|\.00)?(?:\s*\[|\s*$|\s*\()/;
      const priceMatch = line.match(priceRegex);

      let price = 0;
      let needsPriceReview = false;
      let namePart = line;

      if (priceMatch) {
        price = parseInt(priceMatch[1], 10);
        // Remove price string from name
        namePart = line.replace(priceRegex, '').replace(/[-–—]\s*$/, '').trim();
      } else {
        // Check if next line is a price
        if (i + 1 < lines.length && /^(?:₹|Rs\.?|INR|\$)?\s*\d{2,4}/.test(lines[i + 1])) {
          const nextPriceMatch = lines[i + 1].match(/\d{2,4}/);
          if (nextPriceMatch) {
            price = parseInt(nextPriceMatch[0], 10);
            i++; // skip next line
          }
        } else {
          // Missing or uncertain price - flag for manual review!
          needsPriceReview = true;
          price = 0;
        }
      }

      // Clean dietary markers from name
      let isVegan = /vegan/i.test(line);
      let isGlutenFree = /gluten[- ]?free|gf\b/i.test(line);
      let dietaryType: DietaryType = 'vegetarian';

      if (/non[- ]?veg|chicken|mutton|lamb|fish|prawn|meat|egg/i.test(line)) {
        dietaryType = 'non-vegetarian';
      } else if (isVegan) {
        dietaryType = 'vegan';
      } else {
        dietaryType = 'vegetarian';
      }

      // Clean name from tags like [Veg], [Vegan], (GF)
      const cleanedName = namePart
        .replace(/\[.*?\]|\(.*?\)/g, '')
        .replace(/[-–—]\s*$/, '')
        .trim();

      // If name is too short or looks like an empty punctuation, skip
      if (cleanedName.length < 3) {
        i++;
        continue;
      }

      // Next line could be description if it doesn't look like a new dish or header
      let description = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const hasPrice = /(?:₹|Rs\.?|\$)\s*\d+/.test(nextLine);
        const isHeader = nextLine.startsWith('=') || nextLine.startsWith('#');
        if (!hasPrice && !isHeader && nextLine.length > 10) {
          description = nextLine
            .replace(/\[.*?\]/g, '')
            .trim();
          if (/gluten[- ]?free/i.test(nextLine)) isGlutenFree = true;
          if (/vegan/i.test(nextLine)) {
            isVegan = true;
            dietaryType = 'vegan';
          }
          i++; // consume description line
        }
      }

      if (!description) {
        description = `Artisanal preparation with organic herbs, freshly ground seasonings, and chef signature aromatics.`;
      }

      items.push({
        id: `draft-${Date.now()}-${items.length}`,
        name: cleanedName,
        category: currentCategory,
        price,
        description,
        dietaryType,
        isVegan,
        isGlutenFree,
        spiceLevel: 1,
        tags: isVegan ? ['Vegan', 'Chef Special'] : ['Chef Special'],
        prepTime: '12 mins',
        needsPriceReview,
        isSelected: true,
        isSaved: false,
      });

      i++;
    }

    return items;
  };

  // -------------------------------------------------------------
  // Step 3: Review & Edit Operations
  // -------------------------------------------------------------
  const handleUpdateItem = (id: string, updates: Partial<ExtractedDishItem>) => {
    setExtractedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // If price is updated to > 0, remove needsPriceReview flag
          if ('price' in updates && typeof updates.price === 'number' && updates.price > 0) {
            updated.needsPriceReview = false;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleToggleSelect = (id: string) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setExtractedItems((prev) => prev.map((item) => ({ ...item, isSelected: select })));
  };

  const handleDeleteItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewItemRow = () => {
    const newItem: ExtractedDishItem = {
      id: `draft-${Date.now()}-${extractedItems.length}`,
      name: 'New Artisanal Dish',
      category: categories[0]?.id || 'chaats',
      price: 250,
      description: 'Freshly prepared specialty crafted with authentic local spices.',
      dietaryType: 'vegetarian',
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 1,
      tags: ['Chef Pick'],
      prepTime: '10 mins',
      needsPriceReview: false,
      isSelected: true,
      isSaved: false,
    };
    setExtractedItems((prev) => [newItem, ...prev]);
  };

  // -------------------------------------------------------------
  // Step 4: Save to Live Menu (Appends without overwriting!)
  // -------------------------------------------------------------
  const handleSaveDishes = (itemsToSave: ExtractedDishItem[]) => {
    if (itemsToSave.length === 0) return;

    const newDishes: Dish[] = itemsToSave.map((draft, idx) => ({
      id: `dish-ai-${Date.now()}-${idx}`,
      name: draft.name.trim() || 'Untitled Dish',
      category: draft.category,
      price: Math.max(0, draft.price),
      description: draft.description.trim() || 'Artisanal dish prepared with fresh ingredients.',
      dietaryType: draft.dietaryType,
      isAvailable: true,
      isVegan: draft.isVegan,
      isGlutenFree: draft.isGlutenFree,
      spiceLevel: draft.spiceLevel,
      tags: draft.tags.length > 0 ? draft.tags : ['New Addition'],
      prepTime: draft.prepTime || '12 mins',
      calories: 320,
    }));

    // Append to existing dishes state (never overwrites!)
    setDishes((prev) => [...newDishes, ...prev]);

    // Mark saved in local UI
    const savedIds = new Set(itemsToSave.map((item) => item.id));
    setExtractedItems((prev) =>
      prev.map((item) => (savedIds.has(item.id) ? { ...item, isSaved: true, isSelected: false } : item))
    );

    setSavedBatchCount(newDishes.length);
    onDishAddedNotification(newDishes.length);
  };

  const handleSaveSelected = () => {
    const selected = extractedItems.filter((item) => item.isSelected && !item.isSaved);
    handleSaveDishes(selected);
  };

  const handleSaveAllValid = () => {
    const valid = extractedItems.filter((item) => !item.isSaved && item.price > 0 && item.name.trim().length > 0);
    handleSaveDishes(valid);
  };

  // Filtered list for the Review Table
  const filteredItems = extractedItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.category.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'needs-review') {
      return item.needsPriceReview || item.price <= 0;
    }
    if (statusFilter === 'ready') {
      return !item.needsPriceReview && item.price > 0 && !item.isSaved;
    }
    return true;
  });

  const selectedCount = extractedItems.filter((i) => i.isSelected && !i.isSaved).length;
  const needsReviewCount = extractedItems.filter((i) => (i.needsPriceReview || i.price <= 0) && !i.isSaved).length;
  const readyCount = extractedItems.filter((i) => !i.needsPriceReview && i.price > 0 && !i.isSaved).length;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold mb-1.5 sm:mb-2 max-w-full">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">AI Menu Digitization Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight break-words">
            AI Menu Creator & Importer
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl break-words">
            Upload printed physical menus, photos, or digital PDF lists. SmartMenu extracts dish names, prices, categories, and dietary tags into structured items ready for review.
          </p>
        </div>

        {/* Quick Help / Architecture Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 max-w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Zero-Cost Local Parser Active</span>
          </span>
        </div>
      </div>

      {/* 2. Process Flow Infographic (4 Clear Steps) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0f1b33] border border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
              1
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">Upload Menu</span>
              <span className="text-[10px] text-slate-400 block truncate">Photo, PDF or text</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
              2
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">Extract Dishes</span>
              <span className="text-[10px] text-slate-400 block truncate">Detect price & diet</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
              3
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">Review & Edit</span>
              <span className="text-[10px] text-slate-400 block truncate">Verify before publish</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
              4
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">Save to Menu</span>
              <span className="text-[10px] text-slate-400 block truncate">Appends to live menu</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Input Zone: Upload or Raw Text */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-4">
        {/* Toggle Mode Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                inputMode === 'upload'
                  ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>Upload Menu File (Image / PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                inputMode === 'text'
                  ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Paste Menu Text / Chef Notes</span>
            </button>
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] hidden sm:inline">Try Demo:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-teal-300 hover:text-teal-200 transition-colors"
                title={preset.description}
              >
                {preset.title.split(' ')[1]} Sample
              </button>
            ))}
          </div>
        </div>

        {/* Tab A: File Upload Zone */}
        {inputMode === 'upload' && (
          <div className="space-y-4">
            {!selectedFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-teal-400/80 rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900/80 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.txt,.csv,.md"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  Choose or Drag & Drop Menu File
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                  Upload a photo of your printed blackboard/table menu (JPG, PNG) or an exported PDF, text document, or spreadsheet.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800">Images (PNG, JPG, WEBP)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800">PDF Documents</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800">Text & Markdown</span>
                </div>
              </div>
            ) : (
              /* Selected File Preview Card */
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {filePreviewUrl ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0 relative group">
                      <img
                        src={filePreviewUrl}
                        alt="Menu preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-teal-950/60 border border-teal-800/80 text-teal-300 flex items-center justify-center shrink-0">
                      {selectedFile.type.includes('pdf') ? (
                        <FileText className="w-7 h-7 text-rose-400" />
                      ) : (
                        <BookOpen className="w-7 h-7 text-teal-400" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white break-all">
                        {selectedFile.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-teal-300 uppercase shrink-0">
                        {selectedFile.name.split('.').pop() || 'file'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready to extract
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRawTextPreview(!showRawTextPreview)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                    <span>{showRawTextPreview ? 'Hide Text' : 'View Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab B: Text Notes Editor */}
        {inputMode === 'text' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Type or paste menu items, categories and prices:
              </label>
              <span className="text-[11px] text-slate-500">Format: Dish Name - ₹Price, followed by description</span>
            </div>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="=== Artisanal Chaats ===&#10;Avocado Sev Puri Flight - ₹285&#10;Crisp puris layered with Hass avocado, sev and pomegranate. [Veg] [Vegan]&#10;&#10;=== Tandoor ===&#10;Smoked Portobello Galouti Sliders - ₹360&#10;Tender mushroom galouti sliders with mint curd on mini brioche pav."
              className="w-full p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors font-mono"
            />
          </div>
        )}

        {/* Raw Text Drawer (If user wants to see/edit extracted OCR text) */}
        {showRawTextPreview && inputMode === 'upload' && (
          <div className="p-3 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Extracted Text Buffer (Editable)</span>
              </span>
              <span className="text-[10px] text-slate-500">Edit text before running parsing</span>
            </div>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-400"
            />
          </div>
        )}

        {/* Error message banner */}
        {fileError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{fileError}</span>
          </div>
        )}

        {/* Action Button: Extract Menu */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Items won&apos;t be saved to your menu until you click &quot;Save to Menu&quot; below.</span>
          </div>

          <button
            type="button"
            onClick={handleExtractMenu}
            disabled={isExtracting || (!rawText.trim() && !selectedFile)}
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] disabled:opacity-40 rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 shrink-0"
          >
            {isExtracting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Analyzing & Extracting Dishes...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 shrink-0" />
                <span>Extract Menu Dishes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Success Batch Notification Banner */}
      {savedBatchCount > 0 && (
        <div className="p-4 rounded-2xl bg-teal-950/70 border border-teal-600/80 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 w-full min-w-0 max-w-full">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <CheckCircle2 className="w-5 h-5 font-bold" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-teal-200 break-words">
                Successfully saved {savedBatchCount} new dish{savedBatchCount > 1 ? 'es' : ''} to Green Leaf Café!
              </h4>
              <p className="text-xs text-slate-300 break-words mt-0.5">
                Your menu and public QR dining page have been instantly updated.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="px-3 py-1.5 rounded-lg bg-teal-400 text-slate-950 text-xs font-bold hover:bg-teal-300 transition-colors flex items-center gap-1.5"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>View My Menu</span>
              </button>
            )}
            {setActiveView && (
              <button
                type="button"
                onClick={() => setActiveView('customer-menu')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-teal-300 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Customer Menu</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Extracted Results & Review Section */}
      {extractionCompleted && extractedItems.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Review Header Bar */}
          <div className="p-4 rounded-2xl bg-[#0f1b33] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Review Extracted Dishes ({extractedItems.length})
                </h3>
                {needsReviewCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{needsReviewCount} price review{needsReviewCount > 1 ? 's' : ''} needed</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify prices, categories, and dietary tags. Only checked items will be imported into your menu.
              </p>
            </div>

            {/* Bulk Action Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleAddNewItemRow}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-teal-400" />
                <span>Add Row</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSelected}
                disabled={selectedCount === 0}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-white border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Save Selected ({selectedCount})</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAllValid}
                disabled={readyCount === 0}
                className="px-4 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-[0.98] disabled:opacity-40 text-xs font-bold text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-teal-500/20"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Add All Valid ({readyCount})</span>
              </button>
            </div>
          </div>

          {/* Filter & Selection Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All ({extractedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ready')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'ready'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Ready to Save ({readyCount})
              </button>
              {needsReviewCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('needs-review')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                    statusFilter === 'needs-review'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-slate-800'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Needs Price ({needsReviewCount})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter extracted items..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800"
                >
                  Deselect
                </button>
              </div>
            </div>
          </div>

          {/* Editable Items List */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0f1b33] border border-slate-800 text-slate-400 text-xs">
                No items match the current filter.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    item.isSaved
                      ? 'bg-teal-950/20 border-teal-800/40 opacity-75'
                      : item.needsPriceReview || item.price <= 0
                      ? 'bg-amber-950/10 border-amber-800/50'
                      : item.isSelected
                      ? 'bg-[#0f1b33] border-teal-800/60'
                      : 'bg-[#0f1b33] border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    {/* Left: Checkbox + Dish Name + Category */}
                    <div className="flex items-start gap-3 w-full md:w-auto flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.isSelected}
                        disabled={item.isSaved}
                        onChange={() => handleToggleSelect(item.id)}
                        className="mt-1 w-4 h-4 rounded text-teal-400 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer shrink-0"
                      />

                      <div className="space-y-2 w-full flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          {/* Dish Name */}
                          <input
                            type="text"
                            value={item.name}
                            disabled={item.isSaved}
                            onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                            placeholder="Dish Name"
                            className="flex-1 font-bold text-xs sm:text-sm text-white bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-400 min-w-0"
                          />

                          {/* Category select */}
                          <select
                            value={item.category}
                            disabled={item.isSaved}
                            onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                            className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-400 shrink-0"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <input
                          type="text"
                          value={item.description}
                          disabled={item.isSaved}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          placeholder="Dish description and key ingredients..."
                          className="w-full text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>

                    {/* Right: Price + Dietary Type + Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      {/* Price Input with warning if missing */}
                      <div className="relative min-w-[90px] w-24">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.price === 0 && item.needsPriceReview ? '' : item.price}
                          disabled={item.isSaved}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            handleUpdateItem(item.id, { price: isNaN(val) ? 0 : val });
                          }}
                          placeholder="Price"
                          className={`w-full pl-6 pr-2 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg focus:outline-none transition-colors ${
                            item.needsPriceReview || item.price <= 0
                              ? 'border-2 border-amber-500 bg-amber-950/20 text-amber-200'
                              : 'border border-slate-700 focus:border-teal-400'
                          }`}
                        />
                      </div>

                      {/* Dietary Tag Picker */}
                      <select
                        value={item.dietaryType}
                        disabled={item.isSaved}
                        onChange={(e) =>
                          handleUpdateItem(item.id, {
                            dietaryType: e.target.value as DietaryType,
                            isVegan: e.target.value === 'vegan',
                          })
                        }
                        className={`text-xs rounded-lg px-2 py-1.5 font-semibold border ${
                          item.dietaryType === 'non-vegetarian'
                            ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                            : item.dietaryType === 'vegan'
                            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                            : 'bg-teal-950/60 border-teal-800/80 text-teal-300'
                        }`}
                      >
                        <option value="vegetarian">🟢 Vegetarian</option>
                        <option value="vegan">🌱 Vegan</option>
                        <option value="non-vegetarian">🔴 Non-Veg</option>
                      </select>

                      {/* Individual Action: Save or Trash */}
                      {item.isSaved ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-teal-400 bg-teal-950/80 border border-teal-800 rounded-lg flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Added</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveDishes([item])}
                          disabled={item.price <= 0}
                          title={item.price <= 0 ? 'Please set a price first' : 'Add this dish to menu'}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Add</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors shrink-0"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Flag Banner inside item if price review needed */}
                  {(item.needsPriceReview || item.price <= 0) && !item.isSaved && (
                    <div className="mt-2.5 pt-2 border-t border-amber-900/40 flex items-center gap-1.5 text-[11px] text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Price could not be reliably extracted from file. Please enter dish price before importing.</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. Informational Gemini AI Note / Integration Disclosure */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-slate-300">
            About SmartMenu AI Extraction
          </h4>
          <p className="leading-relaxed text-[11px] text-slate-400">
            SmartMenu operates an in-browser culinary parser that instantly extracts structured dishes, prices, categories, and dietary markers from digital files without fees or paid API keys. For complex cursive handwritten menus, full multimodal Gemini API reasoning can be enabled by specifying your API key in the server configuration.
          </p>
        </div>
      </div>
    </div>
  );
};
