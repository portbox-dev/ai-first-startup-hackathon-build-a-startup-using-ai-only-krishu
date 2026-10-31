import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Utensils, 
  Leaf, 
  Clock, 
  Sparkles, 
  Check, 
  X, 
  AlertTriangle, 
  RotateCcw,
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { Dish, Category, RestaurantInfo, DietaryType, ActiveView } from '../../types';
import { INITIAL_DISHES } from '../../data/initialData';
import { saveDishToCloud, deleteDishFromCloud } from '../../supabase/syncService';
import { uploadDishPhoto, validatePhotoFile } from '../../supabase/imageService';

interface MenuManagementTabProps {
  restaurant: RestaurantInfo;
  categories: Category[];
  dishes: Dish[];
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  onNotification?: (msg: string) => void;
  setActiveView?: (view: ActiveView) => void;
  cloudRestaurantId?: string | null;
}

export const MenuManagementTab: React.FC<MenuManagementTabProps> = ({
  restaurant,
  categories,
  dishes,
  setDishes,
  isAddModalOpen,
  setIsAddModalOpen,
  onNotification,
  setActiveView,
  cloudRestaurantId,
}) => {
  // Filter and search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const [selectedDietary, setSelectedDietary] = useState<'all' | 'vegetarian' | 'vegan' | 'non-vegetarian'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit dish state
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Delete dish confirmation state
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);

  // Restore sample dishes confirmation state
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Form states for Add Dish
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState(categories[0]?.id || 'chaats');
  const [addPrice, setAddPrice] = useState('280');
  const [addDesc, setAddDesc] = useState('');
  const [addDietaryType, setAddDietaryType] = useState<DietaryType>('vegetarian');
  const [addIsAvailable, setAddIsAvailable] = useState(true);
  const [addPrepTime, setAddPrepTime] = useState('12 mins');
  const [addSpiceLevel, setAddSpiceLevel] = useState<0 | 1 | 2 | 3>(1);
  const [addIsGlutenFree, setAddIsGlutenFree] = useState(false);
  const [addImage, setAddImage] = useState<string>('');
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addErrors, setAddErrors] = useState<{ [key: string]: string }>({});

  // Form states for Edit Dish
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDietaryType, setEditDietaryType] = useState<DietaryType>('vegetarian');
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [editPrepTime, setEditPrepTime] = useState('12 mins');
  const [editSpiceLevel, setEditSpiceLevel] = useState<0 | 1 | 2 | 3>(1);
  const [editIsGlutenFree, setEditIsGlutenFree] = useState(false);
  const [editImage, setEditImage] = useState<string>('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});

  // Image upload feedback state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleSelectAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error || 'Invalid photo');
      return;
    }

    setAddImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAddImage(previewUrl);
  };

  const handleSelectEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error || 'Invalid photo');
      return;
    }

    setEditImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setEditImage(previewUrl);
  };

  const notify = (msg: string) => {
    if (onNotification) {
      onNotification(msg);
    }
  };

  // Open Edit Modal with initialized data
  const handleOpenEdit = (dish: Dish) => {
    setEditingDish(dish);
    setEditName(dish.name);
    setEditCategory(dish.category);
    setEditPrice(dish.price.toString());
    setEditDesc(dish.description);
    setEditDietaryType(dish.dietaryType || (dish.isVegan ? 'vegan' : 'vegetarian'));
    setEditIsAvailable(dish.isAvailable);
    setEditPrepTime(dish.prepTime || '12 mins');
    setEditSpiceLevel(typeof dish.spiceLevel === 'number' ? dish.spiceLevel : 1);
    setEditIsGlutenFree(dish.isGlutenFree);
    setEditImage(dish.image || '');
    setEditImageFile(null);
    setPhotoError(null);
    setEditErrors({});
  };

  // Quick Toggle Availability
  const handleToggleAvailability = (dish: Dish) => {
    const nextStatus = !dish.isAvailable;
    const updated = { ...dish, isAvailable: nextStatus };
    setDishes((prev) =>
      prev.map((d) => (d.id === dish.id ? updated : d))
    );
    if (cloudRestaurantId) {
      saveDishToCloud(updated, cloudRestaurantId).catch((err) => {
        console.warn('Cloud sync error for toggle availability:', err);
      });
    }
    notify(
      nextStatus
        ? `"${dish.name}" marked as Available`
        : `"${dish.name}" marked as Unavailable (Sold Out)`
    );
  };

  // Confirm Delete Dish
  const handleConfirmDelete = () => {
    if (!dishToDelete) return;
    const deletedName = dishToDelete.name;
    const deletedId = dishToDelete.id;
    setDishes((prev) => prev.filter((d) => d.id !== deletedId));
    setDishToDelete(null);
    if (cloudRestaurantId) {
      deleteDishFromCloud(deletedId, cloudRestaurantId).catch((err) => {
        console.warn('Cloud sync error for delete dish:', err);
      });
    }
    notify(`"${deletedName}" was removed from the menu.`);
  };

  // Restore Default Sample Dishes
  const handleRestoreDefaults = () => {
    setDishes(INITIAL_DISHES);
    setIsRestoreModalOpen(false);
    notify('Sample menu restored with 14 authentic dishes.');
  };

  // Add Dish validation and submit
  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!addName.trim()) {
      errors.name = 'Dish name is required.';
    }

    const parsedPrice = parseFloat(addPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = 'Price must be a valid non-negative number (₹0 or greater).';
    }

    if (!addDesc.trim()) {
      errors.desc = 'Please enter a brief description for this dish.';
    }

    if (!addCategory) {
      errors.category = 'Please select a menu category.';
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    let finalImageUrl: string | undefined = addImage.trim() || undefined;
    let photoUploadedToCloud = false;
    if (addImageFile) {
      setIsUploadingPhoto(true);
      const uploadRes = await uploadDishPhoto(addImageFile, cloudRestaurantId);
      setIsUploadingPhoto(false);
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
        photoUploadedToCloud = !uploadRes.isFallback;
      }
    }

    const newDish: Dish = {
      id: `dish-${Date.now()}`,
      name: addName.trim(),
      category: addCategory,
      price: parsedPrice,
      description: addDesc.trim(),
      image: finalImageUrl,
      dietaryType: addDietaryType,
      isAvailable: addIsAvailable,
      isVegan: addDietaryType === 'vegan',
      isGlutenFree: addIsGlutenFree,
      spiceLevel: addSpiceLevel,
      tags: ['Chef Creation'],
      prepTime: addPrepTime.trim() || '12 mins',
      calories: 320,
    };

    setDishes((prev) => [newDish, ...prev]);
    if (cloudRestaurantId) {
      saveDishToCloud(newDish, cloudRestaurantId).catch((err) => {
        console.warn('Cloud sync error for create dish:', err);
      });
    }
    setIsAddModalOpen(false);
    resetAddForm();
    if (addImageFile) {
      if (photoUploadedToCloud) {
        notify(`"${newDish.name}" added to menu with cloud-hosted photo!`);
      } else {
        notify(`"${newDish.name}" added (photo saved locally in browser).`);
      }
    } else {
      notify(`"${newDish.name}" added to menu successfully!`);
    }
  };

  // Edit Dish validation and submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;

    const errors: { [key: string]: string } = {};

    if (!editName.trim()) {
      errors.name = 'Dish name is required.';
    }

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = 'Price must be a valid non-negative number (₹0 or greater).';
    }

    if (!editDesc.trim()) {
      errors.desc = 'Please enter a brief description for this dish.';
    }

    if (!editCategory) {
      errors.category = 'Please select a menu category.';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    let finalImageUrl: string | undefined = editImage.trim() || undefined;
    let photoUploadedToCloud = false;
    if (editImageFile) {
      setIsUploadingPhoto(true);
      const uploadRes = await uploadDishPhoto(editImageFile, cloudRestaurantId);
      setIsUploadingPhoto(false);
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
        photoUploadedToCloud = !uploadRes.isFallback;
      }
    }

    const updatedDish: Dish = {
      ...editingDish,
      name: editName.trim(),
      category: editCategory,
      price: parsedPrice,
      description: editDesc.trim(),
      image: finalImageUrl,
      dietaryType: editDietaryType,
      isAvailable: editIsAvailable,
      isVegan: editDietaryType === 'vegan',
      isGlutenFree: editIsGlutenFree,
      spiceLevel: editSpiceLevel,
      prepTime: editPrepTime.trim() || '12 mins',
    };

    setDishes((prev) =>
      prev.map((d) => (d.id === editingDish.id ? updatedDish : d))
    );
    if (cloudRestaurantId) {
      saveDishToCloud(updatedDish, cloudRestaurantId).catch((err) => {
        console.warn('Cloud sync error for save dish edit:', err);
      });
    }
    setEditingDish(null);
    if (editImageFile) {
      if (photoUploadedToCloud) {
        notify(`"${updatedDish.name}" updated with cloud-hosted photo!`);
      } else {
        notify(`"${updatedDish.name}" updated (photo saved locally in browser).`);
      }
    } else {
      notify(`"${updatedDish.name}" updated successfully!`);
    }
  };

  const resetAddForm = () => {
    setAddName('');
    setAddPrice('280');
    setAddDesc('');
    setAddDietaryType('vegetarian');
    setAddIsAvailable(true);
    setAddPrepTime('12 mins');
    setAddSpiceLevel(1);
    setAddIsGlutenFree(false);
    setAddImage('');
    setAddImageFile(null);
    setPhotoError(null);
    setAddErrors({});
  };

  // Filter dishes
  const filteredDishes = dishes.filter((dish) => {
    // Category filter
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;

    // Availability filter
    const matchesAvailability =
      selectedAvailability === 'all' ||
      (selectedAvailability === 'available' && dish.isAvailable) ||
      (selectedAvailability === 'unavailable' && !dish.isAvailable);

    // Dietary filter
    const dishDiet = dish.dietaryType || (dish.isVegan ? 'vegan' : 'vegetarian');
    const matchesDietary =
      selectedDietary === 'all' || dishDiet === selectedDietary;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      dish.name.toLowerCase().includes(q) ||
      dish.description.toLowerCase().includes(q) ||
      dish.tags.some((t) => t.toLowerCase().includes(q)) ||
      categories.find((c) => c.id === dish.category)?.name.toLowerCase().includes(q);

    return matchesCategory && matchesAvailability && matchesDietary && matchesSearch;
  });

  const availableCount = dishes.filter((d) => d.isAvailable).length;
  const unavailableCount = dishes.filter((d) => !d.isAvailable).length;
  const isFilteringActive =
    selectedCategory !== 'all' ||
    selectedAvailability !== 'all' ||
    selectedDietary !== 'all' ||
    searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedAvailability('all');
    setSelectedDietary('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full">
      {/* Top Header & Action Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Menu Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure menu dishes, pricing, dietary indicators, and real-time kitchen availability for {restaurant.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {setActiveView && (
            <button
              onClick={() => setActiveView('customer-menu')}
              className="px-3 py-2 text-xs font-semibold text-teal-300 hover:text-white bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/40 rounded-xl transition-all flex items-center gap-1.5"
              title="Preview live public customer menu"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
              <span>View Public Menu</span>
            </button>
          )}

          <button
            onClick={() => setIsRestoreModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all flex items-center gap-1.5"
            title="Reset to realistic sample dishes"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span>Reset Demo Menu</span>
          </button>

          <button
            onClick={() => {
              resetAddForm();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#0f1b33] border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-300">
          <span className="font-semibold text-white">
            {dishes.length} Total Items
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            {availableCount} Available
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            {unavailableCount} Unavailable
          </span>
        </div>

        {isFilteringActive && (
          <div className="flex items-center gap-2">
            <span className="text-teal-300 font-medium text-[11px]">
              Filtered: {filteredDishes.length} items
            </span>
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-3 w-full max-w-full">
        {/* Row 1: Search Field */}
        <div className="relative w-full min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish by name, description, category, or spices..."
            className="w-full pl-10 pr-9 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Category Scroll Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0 max-w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-teal-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60'
            }`}
          >
            All Categories ({dishes.length})
          </button>
          {categories.map((cat) => {
            const count = dishes.filter((d) => d.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-teal-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Row 3: Secondary Filters (Availability & Dietary) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Availability selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Status:</span>
            <button
              onClick={() => setSelectedAvailability('all')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                selectedAvailability === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedAvailability('available')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                selectedAvailability === 'available'
                  ? 'bg-emerald-900/80 text-emerald-200 font-bold border border-emerald-700'
                  : 'text-slate-400 hover:text-emerald-300 bg-slate-900/60'
              }`}
            >
              Available Only
            </button>
            <button
              onClick={() => setSelectedAvailability('unavailable')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                selectedAvailability === 'unavailable'
                  ? 'bg-rose-900/80 text-rose-200 font-bold border border-rose-700'
                  : 'text-slate-400 hover:text-rose-300 bg-slate-900/60'
              }`}
            >
              Unavailable Only
            </button>
          </div>

          {/* Dietary selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Dietary:</span>
            <button
              onClick={() => setSelectedDietary('all')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                selectedDietary === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedDietary('vegetarian')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                selectedDietary === 'vegetarian'
                  ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-700'
                  : 'text-slate-400 hover:text-emerald-300 bg-slate-900/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Veg
            </button>
            <button
              onClick={() => setSelectedDietary('vegan')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                selectedDietary === 'vegan'
                  ? 'bg-teal-950 text-teal-300 font-bold border border-teal-700'
                  : 'text-slate-400 hover:text-teal-300 bg-slate-900/60'
              }`}
            >
              <Leaf className="w-2.5 h-2.5 text-teal-400" />
              Vegan
            </button>
            <button
              onClick={() => setSelectedDietary('non-vegetarian')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                selectedDietary === 'non-vegetarian'
                  ? 'bg-rose-950 text-rose-300 font-bold border border-rose-700'
                  : 'text-slate-400 hover:text-rose-300 bg-slate-900/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Non-Veg
            </button>
          </div>
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full">
        {filteredDishes.map((dish) => {
          const dietary = dish.dietaryType || (dish.isVegan ? 'vegan' : 'vegetarian');

          return (
            <div
              key={dish.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between min-w-0 ${
                dish.isAvailable
                  ? 'bg-[#0f1b33] border-slate-800 hover:border-slate-700'
                  : 'bg-[#0f1b33]/60 border-rose-900/40 opacity-85'
              }`}
            >
              <div className="min-w-0">
                {/* Header: Photo + Title + Price */}
                <div className="flex items-start gap-3 mb-2.5 sm:mb-3 min-w-0">
                  {dish.image ? (
                    <img
                      src={dish.image}
                      alt={dish.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shrink-0">
                      <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate" title={dish.name}>
                        {dish.name}
                      </h3>
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-teal-300 mt-0.5">
                      ₹{dish.price}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 capitalize truncate mt-0.5">
                      {categories.find((c) => c.id === dish.category)?.name || dish.category}
                    </div>
                  </div>
                </div>

                {/* Dietary Label & Availability Badge Row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {/* Vegetarian / Vegan / Non-Veg Indicator */}
                  {dietary === 'vegan' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-950/90 text-teal-300 border border-teal-800/80">
                      <Leaf className="w-3 h-3 text-teal-400 shrink-0" />
                      <span>Vegan</span>
                    </span>
                  ) : dietary === 'vegetarian' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-800/80">
                      <span className="w-2.5 h-2.5 border border-emerald-400 flex items-center justify-center p-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      </span>
                      <span>Vegetarian</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/90 text-rose-300 border border-rose-800/80">
                      <span className="w-2.5 h-2.5 border border-rose-400 flex items-center justify-center p-0.5">
                        <span className="w-1 h-1 rounded-full bg-rose-400" />
                      </span>
                      <span>Non-Vegetarian</span>
                    </span>
                  )}

                  {/* Availability Badge */}
                  {dish.isAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>Available</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                      <XCircle className="w-3 h-3 shrink-0" />
                      <span>Unavailable (86&apos;d)</span>
                    </span>
                  )}

                  {dish.isGlutenFree && (
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                      Gluten-Free
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2.5">
                  {dish.description}
                </p>

                {/* Prep Time & Spice Info */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 pb-2.5 border-b border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {dish.prepTime || '12 mins'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {dish.spiceLevel === 0 ? 'Mild' : dish.spiceLevel === 1 ? 'Medium Spice' : dish.spiceLevel === 2 ? 'Spicy' : 'Fiery Hot'}
                  </span>
                  {dish.calories ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{dish.calories} kcal</span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Bottom Functional Action Controls */}
              <div className="pt-3 flex items-center justify-between gap-2 mt-auto">
                {/* 1-Click Toggle Availability Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(dish)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    dish.isAvailable
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold shadow-sm'
                  }`}
                  title={dish.isAvailable ? 'Click to mark as Unavailable' : 'Click to mark as Available'}
                >
                  {dish.isAvailable ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Mark Unavailable</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Mark Available</span>
                    </>
                  )}
                </button>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(dish)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                    title="Edit dish details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDishToDelete(dish)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
                    title="Delete dish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State when filters yield no results */}
      {filteredDishes.length === 0 && dishes.length > 0 && (
        <div className="text-center py-12 px-4 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-3">
          <Utensils className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-white">No dishes match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keyword or resetting category/status filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-teal-300 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Empty State when menu has 0 dishes */}
      {dishes.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-3">
          <Utensils className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base sm:text-lg font-bold text-white">Your menu is currently empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Get started by adding your first restaurant dish, or restore the sample menu with 14 dishes.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                resetAddForm();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-xs font-bold text-slate-950 transition-colors"
            >
              Add First Dish
            </button>
            <button
              onClick={handleRestoreDefaults}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Load Sample Menu
            </button>
          </div>
        </div>
      )}

      {/* ADD DISH MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1326] border border-slate-700/80 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Add New Menu Dish</h2>
            <p className="text-xs text-slate-400 mb-4 sm:mb-6">
              Create a dish for {restaurant.name}. It will immediately update in your dashboard and customer QR menus.
            </p>

            <form onSubmit={handleCreateDish} className="space-y-3.5 sm:space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dish Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => {
                    setAddName(e.target.value);
                    if (addErrors.name) setAddErrors({ ...addErrors, name: '' });
                  }}
                  placeholder="e.g. Saffron Malai Paneer Kulcha"
                  className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                    addErrors.name ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-teal-400'
                  }`}
                />
                {addErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{addErrors.name}</p>
                )}
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={addPrice}
                    onChange={(e) => {
                      setAddPrice(e.target.value);
                      if (addErrors.price) setAddErrors({ ...addErrors, price: '' });
                    }}
                    className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                      addErrors.price ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-teal-400'
                    }`}
                  />
                  {addErrors.price && (
                    <p className="text-[11px] text-rose-400 mt-1">{addErrors.price}</p>
                  )}
                </div>
              </div>

              {/* Dish Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dish Photo <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2.5">
                  {addImage ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={addImage}
                        alt="Dish Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-white font-medium truncate">
                          {addImageFile ? addImageFile.name : 'Photo preview active'}
                        </p>
                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1 text-[11px] font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-700 inline-flex items-center gap-1">
                            <Upload className="w-3 h-3 text-teal-400" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={handleSelectAddFile}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setAddImage('');
                              setAddImageFile(null);
                              setPhotoError(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-900/40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl hover:border-teal-500/50 transition-colors bg-slate-950/40 text-center cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-teal-300">
                        Upload dish photo from device
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        JPG, PNG, or WebP up to 5 MB
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleSelectAddFile}
                      />
                    </label>
                  )}

                  {/* Fallback Direct URL field */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 shrink-0">Or Photo URL:</span>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={addImage.startsWith('data:') || addImage.startsWith('blob:') ? '' : addImage}
                      onChange={(e) => {
                        setAddImage(e.target.value);
                        setAddImageFile(null);
                        setPhotoError(null);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {photoError && (
                    <p className="text-[11px] text-rose-400 font-medium">{photoError}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={addDesc}
                  onChange={(e) => {
                    setAddDesc(e.target.value);
                    if (addErrors.desc) setAddErrors({ ...addErrors, desc: '' });
                  }}
                  placeholder="Appetizing culinary description highlighting fresh ingredients, spices, and textures..."
                  className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                    addErrors.desc ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-teal-400'
                  }`}
                />
                {addErrors.desc && (
                  <p className="text-[11px] text-rose-400 mt-1">{addErrors.desc}</p>
                )}
              </div>

              {/* Dietary Type & Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Dietary Classification <span className="text-rose-400">*</span>
                  </label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="addDietary"
                        checked={addDietaryType === 'vegetarian'}
                        onChange={() => setAddDietaryType('vegetarian')}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Pure Vegetarian
                      </span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="addDietary"
                        checked={addDietaryType === 'vegan'}
                        onChange={() => setAddDietaryType('vegan')}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="flex items-center gap-1.5">
                        <Leaf className="w-2.5 h-2.5 text-teal-400" />
                        100% Vegan
                      </span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="addDietary"
                        checked={addDietaryType === 'non-vegetarian'}
                        onChange={() => setAddDietaryType('non-vegetarian')}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Non-Vegetarian
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Initial Availability Status
                  </label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="addAvailability"
                        checked={addIsAvailable}
                        onChange={() => setAddIsAvailable(true)}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="text-emerald-300 font-medium">Available (In Stock)</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="addAvailability"
                        checked={!addIsAvailable}
                        onChange={() => setAddIsAvailable(false)}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="text-rose-300 font-medium">Unavailable (Sold Out)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Prep time & Spice level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preparation Time
                  </label>
                  <input
                    type="text"
                    value={addPrepTime}
                    onChange={(e) => setAddPrepTime(e.target.value)}
                    placeholder="e.g. 12 mins"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Spice Level
                  </label>
                  <select
                    value={addSpiceLevel}
                    onChange={(e) => setAddSpiceLevel(Number(e.target.value) as 0 | 1 | 2 | 3)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value={0}>0 - Mild / Sweet</option>
                    <option value={1}>1 - Medium Spice</option>
                    <option value={2}>2 - Spicy Punch</option>
                    <option value={3}>3 - Fiery Hot</option>
                  </select>
                </div>
              </div>

              {/* Gluten-free checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addIsGlutenFree}
                    onChange={(e) => setAddIsGlutenFree(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-teal-400 focus:ring-teal-400"
                  />
                  <span>Gluten-Free certified recipe</span>
                </label>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-all shadow-md shadow-teal-500/20"
                >
                  Save & Add Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DISH MODAL */}
      {editingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1326] border border-slate-700/80 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingDish(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Edit Dish: {editingDish.name}</h2>
            <p className="text-xs text-slate-400 mb-4 sm:mb-6">
              Update pricing, dietary tags, preparation time, and availability. Changes update immediately across all screens.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 sm:space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dish Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editErrors.name) setEditErrors({ ...editErrors, name: '' });
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                    editErrors.name ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-teal-400'
                  }`}
                />
                {editErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{editErrors.name}</p>
                )}
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editPrice}
                    onChange={(e) => {
                      setEditPrice(e.target.value);
                      if (editErrors.price) setEditErrors({ ...editErrors, price: '' });
                    }}
                    className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                      editErrors.price ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-teal-400'
                    }`}
                  />
                  {editErrors.price && (
                    <p className="text-[11px] text-rose-400 mt-1">{editErrors.price}</p>
                  )}
                </div>
              </div>

              {/* Dish Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dish Photo (Optional)
                </label>
                <div className="space-y-2">
                  {editImage ? (
                    <div className="relative rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700 relative">
                        <img
                          src={editImage}
                          alt="Dish preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {editImageFile ? editImageFile.name : 'Current Photo'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {editImageFile ? `${(editImageFile.size / 1024).toFixed(1)} KB` : 'Attached to dish'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="px-2.5 py-1 text-[11px] font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 rounded-lg cursor-pointer transition-colors border border-teal-500/30">
                            Change Photo
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={handleSelectEditFile}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setEditImage('');
                              setEditImageFile(null);
                              setPhotoError(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-900/40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl hover:border-teal-500/50 transition-colors bg-slate-950/40 text-center cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-teal-300">
                        Upload dish photo from device
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        JPG, PNG, or WebP up to 5 MB
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleSelectEditFile}
                      />
                    </label>
                  )}

                  {/* Fallback Direct URL field */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 shrink-0">Or Photo URL:</span>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editImage.startsWith('data:') || editImage.startsWith('blob:') ? '' : editImage}
                      onChange={(e) => {
                        setEditImage(e.target.value);
                        setEditImageFile(null);
                        setPhotoError(null);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {photoError && (
                    <p className="text-[11px] text-rose-400 font-medium">{photoError}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => {
                    setEditDesc(e.target.value);
                    if (editErrors.desc) setEditErrors({ ...editErrors, desc: '' });
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                    editErrors.desc ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-teal-400'
                  }`}
                />
                {editErrors.desc && (
                  <p className="text-[11px] text-rose-400 mt-1">{editErrors.desc}</p>
                )}
              </div>

              {/* Dietary Type & Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Dietary Classification
                  </label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="editDietary"
                        checked={editDietaryType === 'vegetarian'}
                        onChange={() => setEditDietaryType('vegetarian')}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Pure Vegetarian
                      </span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="editDietary"
                        checked={editDietaryType === 'vegan'}
                        onChange={() => setEditDietaryType('vegan')}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="flex items-center gap-1.5">
                        <Leaf className="w-2.5 h-2.5 text-teal-400" />
                        100% Vegan
                      </span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="editDietary"
                        checked={editDietaryType === 'non-vegetarian'}
                        onChange={() => setEditDietaryType('non-vegetarian')}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Non-Vegetarian
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Availability Status
                  </label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="editAvailability"
                        checked={editIsAvailable}
                        onChange={() => setEditIsAvailable(true)}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="text-emerald-300 font-medium">Available (In Stock)</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="editAvailability"
                        checked={!editIsAvailable}
                        onChange={() => setEditIsAvailable(false)}
                        className="text-teal-400 focus:ring-teal-400"
                      />
                      <span className="text-rose-300 font-medium">Unavailable (Sold Out)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Prep Time & Spice Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preparation Time
                  </label>
                  <input
                    type="text"
                    value={editPrepTime}
                    onChange={(e) => setEditPrepTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Spice Level
                  </label>
                  <select
                    value={editSpiceLevel}
                    onChange={(e) => setEditSpiceLevel(Number(e.target.value) as 0 | 1 | 2 | 3)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value={0}>0 - Mild / Sweet</option>
                    <option value={1}>1 - Medium Spice</option>
                    <option value={2}>2 - Spicy Punch</option>
                    <option value={3}>3 - Fiery Hot</option>
                  </select>
                </div>
              </div>

              {/* Gluten-free checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsGlutenFree}
                    onChange={(e) => setEditIsGlutenFree(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-teal-400 focus:ring-teal-400"
                  />
                  <span>Gluten-Free certified recipe</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-md shadow-teal-500/20"
                >
                  {isUploadingPhoto ? 'Saving & Uploading...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {dishToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1326] border border-rose-900/60 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              Delete &quot;{dishToDelete.name}&quot;?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Are you sure you want to remove this dish from the menu? It will be deleted immediately from both the dashboard and customer QR menus.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDishToDelete(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl transition-all shadow-md shadow-rose-900/30"
              >
                Yes, Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE DEFAULT SAMPLE MENU MODAL */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1326] border border-teal-500/40 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              Restore Sample Menu Dishes?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              This will reset the menu back to the 14 authentic Green Leaf Café dishes (including Avocado Sev Puri, Smoked Paneer Tikka, Truffle Kulcha, Dal Makhani, and Saffron Lassi).
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-95 rounded-xl transition-all shadow-md shadow-teal-500/20"
              >
                Reset Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
