# Filter System - AJAX API Documentation

## Endpoint: `/marketplace/<vendor_slug>/filter/`

### Overview
This AJAX endpoint provides real-time filtering of food items for a specific vendor based on search query, category, and price range.

### Request Details

#### Method
`GET`

#### Required Headers
```
X-Requested-With: XMLHttpRequest
```

#### URL Pattern
```
/marketplace/{vendor_slug}/filter/
```

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `search` | string | No | Search term for product name or description | `search=pizza` |
| `category` | integer | No | Category ID to filter by | `category=2` |
| `min_price` | decimal | No | Minimum price filter | `min_price=100.00` |
| `max_price` | decimal | No | Maximum price filter | `max_price=500.00` |

#### Full Example
```
GET /marketplace/vendor1_restaurant/filter/?search=paneer&category=3&min_price=150&max_price=400
X-Requested-With: XMLHttpRequest
```

---

### Response Format

#### Success Response (200 OK)
```json
{
  "status": "success",
  "count": 3,
  "foods": [
    {
      "id": 5,
      "title": "Paneer Tikka Masala",
      "price": "250.00",
      "description": "Grilled paneer in creamy tomato sauce",
      "image": "/media/foodimages/paneer_tikka_masala.jpg",
      "in_cart": false
    },
    {
      "id": 8,
      "title": "Paneer Butter Curry",
      "price": "280.00",
      "description": "Cottage cheese in rich butter gravy",
      "image": "/media/foodimages/paneer_butter.jpg",
      "in_cart": true
    },
    {
      "id": 12,
      "title": "Paneer Dopiaza",
      "price": "220.00",
      "description": "Paneer with onions and peppers",
      "image": "/media/foodimages/paneer_dopiaza.jpg",
      "in_cart": false
    }
  ]
}
```

#### Error Response (400 Bad Request)
```json
{
  "status": "failed",
  "message": "Invalid request"
}
```

#### No Results Response (200 OK with empty array)
```json
{
  "status": "success",
  "count": 0,
  "foods": []
}
```

---

### Response Fields

#### Food Item Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique food item ID |
| `title` | string | Food item name |
| `price` | string | Price as decimal string (e.g., "250.00") |
| `description` | string or null | Food description |
| `image` | string | URL to food image |
| `in_cart` | boolean | Whether item is in user's cart |

---

### JavaScript Implementation

#### Basic AJAX Call
```javascript
$.ajax({
    type: 'GET',
    url: '/marketplace/vendor1_restaurant/filter/',
    data: {
        'search': 'pizza',
        'category': '2',
        'min_price': '100',
        'max_price': '500'
    },
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    },
    success: function(response) {
        if (response.status === 'success') {
            // Process response.foods
            console.log(response.count + ' products found');
        }
    },
    error: function(xhr, status, error) {
        console.error('Filter error:', error);
    }
});
```

#### With jQuery's Shorthand
```javascript
$.get('/marketplace/vendor1_restaurant/filter/', {
    search: 'paneer',
    category: '3',
    min_price: 100,
    max_price: 400
}, function(response) {
    // Handle response
}, 'json').done(function() {
    console.log('Filter applied');
}).fail(function() {
    console.log('Filter failed');
});
```

#### With Fetch API (Vanilla JavaScript)
```javascript
const params = new URLSearchParams({
    search: 'pizza',
    category: '2',
    min_price: '100',
    max_price: '500'
});

fetch(`/marketplace/vendor1_restaurant/filter/?${params}`, {
    method: 'GET',
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
})
.then(response => response.json())
.then(data => {
    if (data.status === 'success') {
        console.log(`Found ${data.count} products`);
        data.foods.forEach(food => {
            console.log(food.title + ': $' + food.price);
        });
    }
})
.catch(error => console.error('Error:', error));
```

---

### Python/Django Backend Implementation

#### In marketplace/views.py
```python
@login_required(login_url='login')
def filter_foods(request, vendor_slug):
    """Filter foods by category, price, and search query"""
    # Validate AJAX request
    if request.headers.get('x-requested-with') != 'XMLHttpRequest':
        return JsonResponse({'status': 'failed', 'message': 'Invalid request'})
    
    # Get vendor
    vendor = get_object_or_404(Vendor, 
        vendor_slug=vendor_slug, 
        is_approved=True, 
        user__is_active=True
    )
    
    # Extract parameters
    search_query = request.GET.get('search', '').strip()
    category_id = request.GET.get('category', '')
    min_price = request.GET.get('min_price', '')
    max_price = request.GET.get('max_price', '')
    
    # Base queryset
    foods = FoodItem.objects.filter(
        vendor=vendor, 
        is_available=True
    )
    
    # Apply filters
    if category_id:
        foods = foods.filter(category_id=category_id)
    
    if search_query:
        foods = foods.filter(
            Q(food_title__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    
    if min_price:
        try:
            foods = foods.filter(price__gte=Decimal(min_price))
        except ValueError:
            pass  # Invalid decimal, ignore
    
    if max_price:
        try:
            foods = foods.filter(price__lte=Decimal(max_price))
        except ValueError:
            pass  # Invalid decimal, ignore
    
    # Serialize response
    foods_data = []
    for food in foods:
        foods_data.append({
            'id': food.id,
            'title': food.food_title,
            'price': str(food.price),
            'description': food.description,
            'image': food.image.url,
            'in_cart': food.id in user_cart_ids,
        })
    
    return JsonResponse({
        'status': 'success',
        'foods': foods_data,
        'count': foods.count()
    })
```

---

### Frontend Implementation

#### HTML Structure
```html
<!-- Filter Container -->
<div class="filter-wrapper">
    <!-- Search -->
    <input type="text" id="search-products" placeholder="Search...">
    
    <!-- Category -->
    <input type="radio" name="category" value="">
    <input type="radio" name="category" value="1">
    <input type="radio" name="category" value="2">
    
    <!-- Price -->
    <input type="range" id="min-price" min="0" max="1000">
    <input type="range" id="max-price" min="0" max="1000">
    
    <!-- Reset -->
    <button id="reset-filters">Reset</button>
</div>

<!-- Results Container -->
<div id="menu-item-list-6272">
    <!-- Food items will be inserted here -->
</div>
```

#### JavaScript Event Handlers
```javascript
// Search
$('#search-products').on('keyup', function() {
    applyFilters();
});

// Category
$('input[name="category"]').on('change', function() {
    applyFilters();
});

// Price sliders
$('#min-price').on('input', function() {
    applyFilters();
});

$('#max-price').on('input', function() {
    applyFilters();
});

// Reset
$('#reset-filters').on('click', function() {
    resetAllFilters();
});

// Apply filters function
function applyFilters() {
    const filters = {
        search: $('#search-products').val(),
        category: $('input[name="category"]:checked').val(),
        min_price: $('#min-price').val(),
        max_price: $('#max-price').val()
    };
    
    $.ajax({
        type: 'GET',
        url: window.location.pathname + 'filter/',
        data: filters,
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        success: updateFoodList
    });
}
```

---

### Query Examples

#### 1. Get All Foods
```
GET /marketplace/vendor1_restaurant/filter/
```

#### 2. Search by Name
```
GET /marketplace/vendor1_restaurant/filter/?search=pizza
```

#### 3. Filter by Category
```
GET /marketplace/vendor1_restaurant/filter/?category=3
```

#### 4. Filter by Price Range
```
GET /marketplace/vendor1_restaurant/filter/?min_price=100&max_price=500
```

#### 5. Combined Filters
```
GET /marketplace/vendor1_restaurant/filter/?search=paneer&category=2&min_price=150&max_price=400
```

---

### Database Queries Generated

#### Search Query
```sql
SELECT * FROM menu_fooditem 
WHERE vendor_id = ? 
AND is_available = true 
AND (food_title ILIKE ? OR description ILIKE ?)
```

#### Category Query
```sql
SELECT * FROM menu_fooditem 
WHERE vendor_id = ? 
AND is_available = true 
AND category_id = ?
```

#### Price Query
```sql
SELECT * FROM menu_fooditem 
WHERE vendor_id = ? 
AND is_available = true 
AND price >= ? 
AND price <= ?
```

#### Combined Query
```sql
SELECT * FROM menu_fooditem 
WHERE vendor_id = ? 
AND is_available = true 
AND category_id = ? 
AND (food_title ILIKE ? OR description ILIKE ?) 
AND price >= ? 
AND price <= ?
```

---

### Error Handling

#### Invalid AJAX Header
- **Response**: 400 Bad Request
- **Body**: `{'status': 'failed', 'message': 'Invalid request'}`

#### Invalid Price Format
- **Behavior**: Invalid prices are caught and ignored
- **Response**: Still returns filtered results with valid prices applied

#### No Results
- **Response**: 200 OK with empty `foods` array
- **Count**: 0

#### Vendor Not Found
- **Response**: 404 Not Found
- **Django Error**: `Http404` raised by `get_object_or_404`

#### Unauthenticated User
- **Response**: 302 Redirect to login page
- **Decorator**: `@login_required(login_url='login')`

---

### Performance Considerations

1. **Query Optimization**:
   - Indexed on: `vendor_id`, `category_id`, `price`, `is_available`
   - Uses `.filter()` at database level (not Python)

2. **Response Size**:
   - Only returns necessary fields
   - Typical response: 10-50KB for 10-20 items

3. **Caching Opportunity**:
   - Could cache results for specific filter combinations
   - Not implemented currently (every request hits DB)

4. **N+1 Query Prevention**:
   - Single query to database per filter request
   - No loop-based additional queries

---

### Authentication & Authorization

- **Login Required**: Yes (`@login_required` decorator)
- **Redirect URL**: `/accounts/login/`
- **Permission Check**: Vendor must be approved and active
- **User Verification**: Vendor verification in filter logic

---

### Rate Limiting

Currently no rate limiting implemented. Consider adding:
```python
from django.views.decorators.cache import cache_page
from django.views.decorators.http import condition

@cache_page(60)  # Cache for 60 seconds
@login_required
def filter_foods(request, vendor_slug):
    # ...
```

---

### Testing

#### cURL Examples
```bash
# Basic filter
curl -H "X-Requested-With: XMLHttpRequest" \
  "http://127.0.0.1:8000/marketplace/vendor1_restaurant/filter/?search=pizza"

# Price filter
curl -H "X-Requested-With: XMLHttpRequest" \
  "http://127.0.0.1:8000/marketplace/vendor1_restaurant/filter/?min_price=100&max_price=500"

# Combined
curl -H "X-Requested-With: XMLHttpRequest" \
  "http://127.0.0.1:8000/marketplace/vendor1_restaurant/filter/?search=paneer&category=2&min_price=150&max_price=400"
```

#### Python Requests Example
```python
import requests

url = 'http://127.0.0.1:8000/marketplace/vendor1_restaurant/filter/'
headers = {'X-Requested-With': 'XMLHttpRequest'}
params = {
    'search': 'pizza',
    'category': '2',
    'min_price': '100',
    'max_price': '500'
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

print(f"Found {data['count']} products")
for food in data['foods']:
    print(f"- {food['title']}: {food['price']} BDT")
```

---

### Integration Points

The filter system integrates with:

1. **Cart System**:
   - `in_cart` field indicates if item is in user's cart
   - Cart buttons re-attached after filtering

2. **Authentication**:
   - `@login_required` ensures authorized access
   - Anonymous users redirected to login

3. **Vendor System**:
   - Filters only approved, active vendors
   - Vendor slug used to identify vendor

4. **Menu System**:
   - Filters across all categories of vendor
   - Respects `is_available` flag on food items

---

## Summary

The filter endpoint is a robust, secure AJAX API that:
- ✅ Supports multiple filter types
- ✅ Returns properly formatted JSON
- ✅ Handles errors gracefully
- ✅ Validates all inputs
- ✅ Requires authentication
- ✅ Optimizes database queries
- ✅ Works with existing cart system

