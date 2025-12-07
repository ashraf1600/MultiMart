# Vendor Detail Page - Search and Filter Implementation

## Overview
A comprehensive search and filter system has been implemented for the vendor detail page at `/marketplace/<vendor_slug>/`. This allows customers to easily find food items by searching, filtering by category, and filtering by price range.

## Features Implemented

### 1. **Search Filter**
- Real-time search box that filters food items by:
  - Food title (case-insensitive)
  - Food description (case-insensitive)
- Appears on the right sidebar
- Triggers filtering on every keystroke

### 2. **Category Filter**
- Radio button filter to display items from specific categories
- "All Categories" option to show all items
- All vendor's categories are dynamically listed

### 3. **Price Range Filter**
- Two-way price filtering:
  - **Range sliders**: Interactive sliders for min and max price
  - **Text input fields**: Manual price entry
  - Both methods are synchronized
- Price range is automatically calculated based on vendor's products
- Filters are applied in real-time

### 4. **Reset Filters Button**
- Single click to reset all filters to default state
- Restores original price range and shows all products

### 5. **Product Count Badge**
- Displays the number of products matching current filters
- Updates dynamically as filters are applied

### 6. **No Results Message**
- Shows helpful message when no products match the filters
- Encourages users to adjust their search criteria

---

## Technical Implementation

### Backend Changes

#### 1. **marketplace/views.py**
- **Added imports**: `Min, Max` from `django.db.models`, `Decimal` from `decimal`
- **Modified `vendor_detail()` view**:
  - Calculates minimum and maximum prices from vendor's food items
  - Passes `min_price` and `max_price` to template context
  
- **New `filter_foods()` view**:
  - AJAX endpoint at `marketplace/<vendor_slug>/filter/`
  - Accepts GET parameters: `search`, `category`, `min_price`, `max_price`
  - Filters FoodItem queryset based on parameters
  - Returns JSON response with filtered foods and count
  - Parameters:
    - `search` (optional): Search term for food title/description
    - `category` (optional): Category ID filter
    - `min_price` (optional): Minimum price filter
    - `max_price` (optional): Maximum price filter

### URL Changes

#### marketplace/urls.py
- Added new route: `path('<slug:vendor_slug>/filter/', views.filter_foods, name='filter_foods')`
- Endpoint: `/marketplace/<vendor_slug>/filter/`

### Frontend Changes

#### 1. **templates/marketplace/vendor_detail.html**
- **Updated filter sidebar** with new UI elements:
  - Search input field with icon
  - Radio buttons for category selection
  - Price range sliders and text inputs
  - Reset filters button
  
- **Updated food listing section**:
  - Added data attributes to food items (food-id, price, title)
  - Added product count badge to tabs
  - Added "no results" message area
  - Updated food list markup for better JavaScript manipulation

- **Added script reference**: 
  - `<script src="{% static 'js/vendor_filter.js' %}"></script>`

#### 2. **static/js/vendor_filter.js** (New File)
A comprehensive JavaScript module that handles:

**Features**:
- Real-time filter application via AJAX
- Event listeners for all filter controls
- Price range validation (prevents min > max)
- Synchronized slider and text input values
- Dynamic DOM manipulation for filtered results
- Cart functionality integration

**Key Functions**:
- `applyFilters()`: Sends AJAX request to backend filter endpoint
- `updateFoodList(foods, count)`: Updates DOM with filtered results
- `attachCartEventHandlers()`: Re-attaches cart buttons after filtering
- `addToCartAjax()` & `decreaseFromCartAjax()`: Handle cart operations
- `showNotification()`: Displays user-friendly messages

**Event Handlers**:
- `#search-products`: Keyup event for search
- `input[name="category"]`: Change event for category radio buttons
- `#min-price`, `#max-price`: Input events for sliders
- `#min-price-input`, `#max-price-input`: Change events for text inputs
- `#reset-filters`: Click event for reset button

---

## How to Use

### For Customers:
1. Navigate to any vendor's detail page: `http://127.0.0.1:8000/marketplace/vendor1_restaurant/`
2. **Search Products**: Type in the search box to find items by name or description
3. **Filter by Category**: Click on a radio button to filter by specific category
4. **Filter by Price**: 
   - Drag the range sliders to set price limits
   - Or enter prices directly in the text input fields
5. **Reset Filters**: Click "Reset Filters" button to clear all selections
6. **Product Count**: Check the tab for the current number of displayed products

### AJAX Request Example:
```
GET /marketplace/vendor1_restaurant/filter/?search=pizza&category=2&min_price=50&max_price=500
X-Requested-With: XMLHttpRequest
```

### AJAX Response Example:
```json
{
  "status": "success",
  "foods": [
    {
      "id": 1,
      "title": "Margherita Pizza",
      "price": "250.00",
      "description": "Fresh mozzarella and basil",
      "image": "/media/foodimages/pizza1.jpg",
      "in_cart": false
    }
  ],
  "count": 1
}
```

---

## Database Queries Used

### Filter by Category:
```python
foods = foods.filter(category_id=category_id)
```

### Filter by Search:
```python
foods = foods.filter(
    Q(food_title__icontains=search_query) |
    Q(description__icontains=search_query)
)
```

### Filter by Price Range:
```python
foods = foods.filter(price__gte=Decimal(min_price))
foods = foods.filter(price__lte=Decimal(max_price))
```

### Get Price Range:
```python
price_data = FoodItem.objects.filter(vendor=vendor, is_available=True).aggregate(
    min_price=Min('price'),
    max_price=Max('price')
)
```

---

## Authentication & Permissions

- **Login Required**: Not required for viewing filtered results
- **AJAX Requests**: Use `X-Requested-With: XMLHttpRequest` header
- **Cart Operations**: Require user authentication
- **Anonymous Users**: Can browse and filter, but must login to add to cart

---

## Error Handling

1. **Invalid Price Inputs**: Non-numeric values are caught and ignored
2. **No Results**: Shows user-friendly message instead of empty state
3. **Price Inversion**: Prevents min_price > max_price with validation
4. **Invalid Requests**: Non-AJAX requests are rejected with 400 response
5. **Failed Filters**: Error messages logged to browser console

---

## Performance Considerations

1. **Prefetch Related**: Original vendor_detail uses `Prefetch` for category/food items
2. **Database Optimization**: Filter queries use indexed fields (vendor, category, price)
3. **AJAX Caching**: Each filter request queries the database (no client-side caching)
4. **DOM Efficiency**: jQuery used for dynamic HTML generation

---

## Browser Compatibility

- Works on all modern browsers supporting:
  - ES6 JavaScript
  - jQuery 3.4.1+
  - CSS3 Flexbox
  - HTML5 input[type="range"]

---

## Future Enhancements

1. Add "Sort by" options (price low-to-high, newest, ratings)
2. Implement pagination for large result sets
3. Add filters for dietary restrictions, ratings, etc.
4. Save user's filter preferences
5. Add filter history/suggestions
6. Implement URL-based filter persistence (querystring)
7. Add advanced filters (delivery time, ratings, etc.)

---

## Testing Checklist

- [ ] Search filter works with partial/full product names
- [ ] Category filter displays correct items
- [ ] Price slider prevents invalid ranges
- [ ] Text inputs accept numeric values only
- [ ] Reset button clears all filters
- [ ] "No results" message shows when appropriate
- [ ] Product count updates correctly
- [ ] Cart add/remove works with filtered items
- [ ] Works on mobile responsive view
- [ ] Filters work for multiple vendors

---

## Files Modified/Created

### Modified:
1. `marketplace/views.py` - Added filter_foods view and updated vendor_detail
2. `marketplace/urls.py` - Added filter_foods URL
3. `templates/marketplace/vendor_detail.html` - Updated UI and added script

### Created:
1. `static/js/vendor_filter.js` - Filter functionality JavaScript

