/**
 * SmartMenu AI Menu Insights Engine
 * Honest, transparent rule-based analytical engine reading actual customer
 * engagement events, dish data, and restaurant settings from browser localStorage.
 * No external APIs, databases, or paid tracking services.
 */

import { Dish, Category, RestaurantInfo, DashboardTab } from '../types';
import { AnalyticsEvent, getEngagementSummary, EngagementSummary } from './analyticsStore';

export type InsightCategory = 'demand' | 'availability' | 'search' | 'engagement' | 'opportunity';
export type InsightSeverity = 'info' | 'positive' | 'warning' | 'critical';

export interface MenuInsight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  observation: string;
  evidence: string;
  recommendation: string;
  actionText?: string;
  actionTab?: DashboardTab;
  relatedDishId?: string;
}

export interface InsightsResult {
  engineType: 'rule-based' | 'ai-model';
  engineLabel: string;
  status: 'empty' | 'preliminary' | 'sufficient';
  sampleSize: number;
  totalVisits: number;
  totalDishViews: number;
  totalSearches: number;
  totalCategoryClicks: number;
  generatedAt: number;
  summaryNote: string;
  insights: MenuInsight[];
}

/**
 * Safely read data from localStorage for insights calculation
 */
export const readStoredDishes = (): Dish[] => {
  try {
    const raw = localStorage.getItem('smartmenu_dishes');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not read smartmenu_dishes from localStorage:', err);
  }
  return [];
};

export const readStoredRestaurant = (): RestaurantInfo | null => {
  try {
    const raw = localStorage.getItem('smartmenu_restaurant');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('Could not read smartmenu_restaurant from localStorage:', err);
  }
  return null;
};

export const readStoredAnalyticsEvents = (restaurantName: string): AnalyticsEvent[] => {
  try {
    // Check both explicit key "smartmenu_analytics_green-leaf-caf-" and normalized key
    const exactKey = 'smartmenu_analytics_green-leaf-caf-';
    const computedKey = `smartmenu_analytics_${(restaurantName || 'green-leaf-cafe').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const raw = localStorage.getItem(exactKey) || localStorage.getItem(computedKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not read analytics events from localStorage:', err);
  }
  return [];
};

/**
 * Generate honest menu insights from actual recorded engagement data
 */
export const generateMenuInsights = (
  restaurant: RestaurantInfo,
  dishes: Dish[],
  categories: Category[]
): InsightsResult => {
  const generatedAt = Date.now();
  const summary: EngagementSummary = getEngagementSummary(restaurant.name);
  const events = readStoredAnalyticsEvents(restaurant.name);
  const sampleSize = events.length;

  // 1. Handle Empty Data State (No interactions recorded yet)
  if (sampleSize === 0 && !summary.hasRecordedData) {
    return {
      engineType: 'rule-based',
      engineLabel: 'Rule-Based Analytics Engine (Local & Free)',
      status: 'empty',
      sampleSize: 0,
      totalVisits: 0,
      totalDishViews: 0,
      totalSearches: 0,
      totalCategoryClicks: 0,
      generatedAt,
      summaryNote:
        'More customer interactions are needed before meaningful insights can be generated. As guests scan your QR code, click dishes, and search the menu, data-driven observations will populate here in real time.',
      insights: [],
    };
  }

  const insights: MenuInsight[] = [];
  const isPreliminary = sampleSize < 5;

  // 2. Analyze Most-Viewed Dishes & Check Availability
  if (summary.mostViewedDishes.length > 0) {
    const topDish = summary.mostViewedDishes[0];
    const liveDishObj = dishes.find((d) => d.id === topDish.id || d.name.toLowerCase() === topDish.name.toLowerCase());
    const isTopDishUnavailable = liveDishObj ? !liveDishObj.isAvailable : false;

    if (isTopDishUnavailable) {
      // Critical Availability Mismatch: Top viewed dish is currently unavailable!
      insights.push({
        id: 'ins-top-dish-unavailable',
        category: 'availability',
        severity: 'critical',
        title: `High-Interest Dish "${topDish.name}" is Marked Unavailable`,
        observation: `"${topDish.name}" has received the most dish detail views (${topDish.views} views), but it is currently marked as sold out / unavailable on guest phones.`,
        evidence: `Recorded ${topDish.views} view events while item status is unavailable.`,
        recommendation: `Check kitchen inventory to restock this dish, or provide a recommended alternative so guests exploring this item are not disappointed.`,
        actionText: 'Update Dish Availability',
        actionTab: 'menu',
        relatedDishId: liveDishObj?.id,
      });
    } else {
      // Positive demand leader
      const totalViews = summary.totalDishViews || 1;
      const share = Math.round((topDish.views / totalViews) * 100);
      insights.push({
        id: 'ins-top-dish-demand',
        category: 'demand',
        severity: 'positive',
        title: `Strong Guest Interest for "${topDish.name}"`,
        observation: `"${topDish.name}" is leading customer engagement with ${topDish.views} detail views (${share}% of all dish views recorded).`,
        evidence: `${topDish.views} views out of ${summary.totalDishViews} total dish expansions.`,
        recommendation: `Ensure consistent ingredients for this item. Consider featuring it near the top of the menu or in your printable QR display stand.`,
        actionText: 'View in Menu Editor',
        actionTab: 'menu',
        relatedDishId: liveDishObj?.id,
      });
    }

    // Runner-up dish if available and significant
    if (summary.mostViewedDishes.length > 1) {
      const runnerUp = summary.mostViewedDishes[1];
      const runnerUpObj = dishes.find((d) => d.id === runnerUp.id || d.name.toLowerCase() === runnerUp.name.toLowerCase());
      if (runnerUpObj && !runnerUpObj.isAvailable) {
        insights.push({
          id: 'ins-runner-up-unavailable',
          category: 'availability',
          severity: 'warning',
          title: `Popular Dish "${runnerUp.name}" is Sold Out`,
          observation: `"${runnerUp.name}" is the #2 most viewed dish (${runnerUp.views} views) but is currently unavailable to customers.`,
          evidence: `${runnerUp.views} views recorded while marked unavailable.`,
          recommendation: `Review availability or consider offering a chef pairing alternative in the recommendation sommelier.`,
          actionText: 'Manage Availability',
          actionTab: 'menu',
          relatedDishId: runnerUpObj.id,
        });
      }
    }
  }

  // 3. Analyze Popular Searches
  if (summary.popularSearches.length > 0) {
    const topSearch = summary.popularSearches[0];
    const term = topSearch.term.toLowerCase();

    // Check if search matches dietary preferences (vegan, gluten, veg)
    const isDietary = /vegan|gluten|veg|jain|spicy|mild/i.test(term);

    if (isDietary) {
      insights.push({
        id: 'ins-search-dietary',
        category: 'search',
        severity: 'info',
        title: `Customer Demand for "${topSearch.term}" Options`,
        observation: `Customers frequently searched for "${topSearch.term}" (${topSearch.count} search queries recorded).`,
        evidence: `${topSearch.count} search queries contained the keyword "${topSearch.term}".`,
        recommendation: `Ensure dishes matching "${topSearch.term}" have prominent dietary tags and clear descriptions so searching customers spot them immediately.`,
        actionText: 'Review Dietary Tags',
        actionTab: 'menu',
      });
    } else {
      // General item search
      const matchingDishes = dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.description.toLowerCase().includes(term)
      );

      insights.push({
        id: 'ins-search-keyword',
        category: 'search',
        severity: 'info',
        title: `High Search Frequency for "${topSearch.term}"`,
        observation: `Guests typed "${topSearch.term}" into the menu search bar ${topSearch.count} time${topSearch.count > 1 ? 's' : ''}.`,
        evidence: `${topSearch.count} searches recorded. Found ${matchingDishes.length} menu dishes matching this query.`,
        recommendation:
          matchingDishes.length === 0
            ? `Guests are searching for "${topSearch.term}", but no current menu dishes contain this exact word. Consider adding an item or mentioning it in an existing dish description.`
            : `Verify that the ${matchingDishes.length} dish(es) matching "${topSearch.term}" are prominently listed and in stock.`,
        actionText: 'Search in Menu Editor',
        actionTab: 'menu',
      });
    }
  }

  // 4. Analyze Most-Viewed Categories vs. Low-Engagement Categories
  if (summary.mostViewedCategories.length > 0) {
    const topCat = summary.mostViewedCategories[0];
    const totalCatClicks = summary.totalCategoryClicks || 1;
    const catShare = Math.round((topCat.views / totalCatClicks) * 100);

    insights.push({
      id: 'ins-top-category',
      category: 'engagement',
      severity: 'positive',
      title: `Most-Explored Category: "${topCat.name}"`,
      observation: `Guests selected the "${topCat.name}" tab more than any other category, accounting for ${catShare}% of category navigations (${topCat.views} clicks).`,
      evidence: `${topCat.views} clicks recorded out of ${totalCatClicks} total category clicks.`,
      recommendation: `Keep the "${topCat.name}" section fresh and well-curated. High customer traffic makes this an ideal spot to introduce high-margin specialty creations.`,
      actionText: 'Review Category Dishes',
      actionTab: 'menu',
    });

    // Check for categories receiving little or zero engagement (only when enough total category data exists)
    if (!isPreliminary && totalCatClicks >= 4) {
      const activeCategoryIdsWithDishes = new Set(dishes.map((d) => d.category));
      const unclickedCategories = categories.filter(
        (cat) =>
          activeCategoryIdsWithDishes.has(cat.id) &&
          !summary.mostViewedCategories.some((c) => c.id === cat.id && c.views > 0)
      );

      if (unclickedCategories.length > 0) {
        const quietCat = unclickedCategories[0];
        insights.push({
          id: 'ins-low-category',
          category: 'opportunity',
          severity: 'warning',
          title: `Low Engagement for "${quietCat.name}"`,
          observation: `The "${quietCat.name}" section has recorded 0 category clicks while guests actively explored other sections.`,
          evidence: `0 clicks recorded across ${totalCatClicks} total category navigations.`,
          recommendation: `Consider featuring a signature hero dish from "${quietCat.name}" on the menu highlights banner or pairing it with popular items in the recommendation sommelier.`,
          actionText: 'Manage Categories',
          actionTab: 'menu',
        });
      }
    }
  }

  // 5. Dish Engagement Opportunities (Dishes in active categories with 0 views)
  if (!isPreliminary && summary.mostViewedDishes.length >= 2) {
    const viewedDishIds = new Set(summary.mostViewedDishes.map((d) => d.id));
    const unviewedAvailableDishes = dishes.filter(
      (d) => d.isAvailable && !viewedDishIds.has(d.id)
    );

    if (unviewedAvailableDishes.length > 0) {
      const candidate = unviewedAvailableDishes[0];
      const catName = categories.find((c) => c.id === candidate.category)?.name || candidate.category;

      insights.push({
        id: 'ins-unviewed-dish',
        category: 'opportunity',
        severity: 'info',
        title: `Engagement Opportunity for "${candidate.name}"`,
        observation: `"${candidate.name}" in ${catName} has recorded 0 detail views, while other dishes in your menu are actively expanded.`,
        evidence: `0 detail clicks recorded for this available item.`,
        recommendation: `Review the title, price (₹${candidate.price}), or description of "${candidate.name}". Adding enticing sensory adjectives or a chef special tag can prompt guests to click.`,
        actionText: 'Edit Dish Details',
        actionTab: 'menu',
        relatedDishId: candidate.id,
      });
    }
  }

  // 6. Overall Menu Availability Ratio
  const unavailableDishes = dishes.filter((d) => !d.isAvailable);
  if (unavailableDishes.length >= 2) {
    insights.push({
      id: 'ins-menu-health-unavailable',
      category: 'availability',
      severity: 'warning',
      title: `${unavailableDishes.length} Dishes Currently Marked Sold Out`,
      observation: `${unavailableDishes.length} out of ${dishes.length} total dishes are currently unavailable (${Math.round((unavailableDishes.length / dishes.length) * 100)}% of your menu).`,
      evidence: `Unavailable items: ${unavailableDishes.map((d) => d.name).slice(0, 3).join(', ')}${unavailableDishes.length > 3 ? '...' : ''}.`,
      recommendation: `Check if any ingredients arrived to re-activate these items before busy service hours. Guests see "Currently Unavailable" overlays for all sold out items.`,
      actionText: 'Review Unavailable Items',
      actionTab: 'menu',
    });
  }

  // Fallback if no specific condition triggered but some data exists
  if (insights.length === 0 && summary.totalVisits > 0) {
    insights.push({
      id: 'ins-general-activity',
      category: 'engagement',
      severity: 'info',
      title: 'Initial Menu Visits Logged',
      observation: `SmartMenu has recorded ${summary.totalVisits} customer visit session${summary.totalVisits > 1 ? 's' : ''}.`,
      evidence: `${summary.totalVisits} menu visit events logged in browser storage.`,
      recommendation: `As guests explore specific dishes, click categories, or search for keywords, targeted culinary observations will appear here automatically.`,
      actionText: 'Open Customer Menu',
    });
  }

  return {
    engineType: 'rule-based',
    engineLabel: 'Rule-Based Analytics Engine (Local & Free)',
    status: isPreliminary ? 'preliminary' : 'sufficient',
    sampleSize,
    totalVisits: summary.totalVisits,
    totalDishViews: summary.totalDishViews,
    totalSearches: summary.totalSearches,
    totalCategoryClicks: summary.totalCategoryClicks,
    generatedAt,
    summaryNote: isPreliminary
      ? `Preliminary insights based on ${sampleSize} recorded interaction${sampleSize > 1 ? 's' : ''}. Findings will gain statistical depth as more guests browse your menu.`
      : `High-confidence menu insights generated from ${sampleSize} actual recorded customer interactions in this browser.`,
    insights,
  };
};
