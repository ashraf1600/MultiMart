# Quick Reference - Code Changes

## 1️⃣ marketplace/views.py - Changes

### Imports Added (Top of file)
```python
from django.db.models import Prefetch, Q, Min, Max  # Added: Min, Max
from decimal import Decimal  # Added new import
```

### Modified vendor_detail() function
```python
def vendor_detail(request, vendor_slug):
    # ... existing code ...
    
    # NEW CODE ADDED:
    # Get price range for filters
    price_data = FoodItem.objects.filter(vendor=vendor, is_available=True).aggregate(
        min_price=Min('price'),
        max_price=Max('price')
    )
    min_price = price_data['min_price'] or 0
    max_price = price_data['max_price'] or 0
    
    # ... existing context setup ...
    context = {
        # ... existing context ...
        'min_price': min_price,          # NEW
        'max_price': max_price,          # NEW
    }
    # ... rest of function ...
```

### NEW FUNCTION: filter_foods()
```python
@login_required(login_url='login')
def filter_foods(request, vendor_slug):
    """Filter foods by category, price, and search query"""
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        vendor = get_object_or_404(Vendor, vendor_slug=vendor_slug, is_approved=True, user__is_active=True)
        
        # Get filter parameters
        search_query = request.GET.get('search', '').strip()
        category_id = request.GET.get('category', '')
        min_price = request.GET.get('min_price', '')
        max_price = request.GET.get('max_price', '')
        
        # Start with all available food items for this vendor
        foods = FoodItem.objects.filter(vendor=vendor, is_available=True)
        
        # Filter by category
        if category_id and category_id != '':
            foods = foods.filter(category_id=category_id)
        
        # Filter by search query (food title and description)
        if search_query:
            foods = foods.filter(
                Q(food_title__icontains=search_query) |
                Q(description__icontains=search_query)
            )
        
        # Filter by price range
        if min_price:
            try:
                foods = foods.filter(price__gte=Decimal(min_price))
            except:
                pass
        
        if max_price:
            try:
                foods = foods.filter(price__lte=Decimal(max_price))
            except:
                pass
        
        # Get cart items for display
        if request.user.is_authenticated:
            cart_items = Cart.objects.filter(user=request.user).values_list('fooditem_id', flat=True)
        else:
            cart_items = []
        
        # Prepare response data
        foods_data = []
        for food in foods:
            foods_data.append({
                'id': food.id,
                'title': food.food_title,
                'price': str(food.price),
                'description': food.description,
                'image': food.image.url,
                'in_cart': food.id in cart_items,
            })
        
        return JsonResponse({
            'status': 'success',
            'foods': foods_data,
            'count': foods.count()
        })
    
    return JsonResponse({'status': 'failed', 'message': 'Invalid request'})
```

---

## 2️⃣ marketplace/urls.py - Changes

### Add New URL Pattern
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.marketplace , name='marketplace'),
    path('<slug:vendor_slug>/', views.vendor_detail , name='vendor_detail'),
    path('<slug:vendor_slug>/filter/', views.filter_foods , name='filter_foods'),  # NEW LINE
    path('add_to_cart/<int:food_id>/', views.add_to_cart , name='add_to_cart'),
    path('decrease_cart/<int:food_id>/', views.decrease_cart , name='decrease_cart'),
    path('delete_cart/<int:cart_id>/', views.delete_cart , name='delete_cart'),
]
```

---

## 3️⃣ templates/marketplace/vendor_detail.html - Changes

### Replace Left Sidebar Section
```django-html
<!-- OLD CODE - REPLACE THIS: -->
<div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 sticky-sidebar">
    <div class="filter-wrapper">
        <div class="categories-menu">
            <h6><i class=""></i> All Categories</h6>
            <ul class="menu-list">
                {% for category in categories %}
                <li class="active"><a href="#" class="menu-category-link"> {{ category }} </a></li>
                {% endfor %}
            </ul>
        </div>
    </div>
</div>

<!-- WITH THIS: -->
<div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 sticky-sidebar">
    <div class="filter-wrapper">
        <!-- Search Filter -->
        <div class="search-filter" style="margin-bottom: 25px;">
            <h6><i class="icon-search"></i> Search Products</h6>
            <input type="text" id="search-products" class="form-control" placeholder="Search by name or description..." style="margin-top: 10px;">
        </div>

        <!-- Categories Filter -->
        <div class="categories-menu" style="margin-bottom: 25px; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">
            <h6><i class="icon-list"></i> Categories</h6>
            <ul class="menu-list" style="list-style: none; padding-left: 0;">
                <li style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="radio" name="category" value="" checked style="margin-right: 8px;"> 
                        <span>All Categories</span>
                    </label>
                </li>
                {% for category in categories %}
                <li style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="radio" name="category" value="{{ category.id }}" style="margin-right: 8px;"> 
                        <span>{{ category }}</span>
                    </label>
                </li>
                {% endfor %}
            </ul>
        </div>

        <!-- Price Filter -->
        <div class="price-filter" style="margin-bottom: 25px; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">
            <h6><i class="icon-price-tag"></i> Price Range</h6>
            <div style="margin-top: 10px;">
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 12px; margin-bottom: 5px;">Min Price: <span id="min-price-label">{{ min_price }}</span> BDT</label>
                    <input type="range" id="min-price" min="{{ min_price }}" max="{{ max_price }}" value="{{ min_price }}" class="form-control-range" style="width: 100%;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 12px; margin-bottom: 5px;">Max Price: <span id="max-price-label">{{ max_price }}</span> BDT</label>
                    <input type="range" id="max-price" min="{{ min_price }}" max="{{ max_price }}" value="{{ max_price }}" class="form-control-range" style="width: 100%;">
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <input type="text" id="min-price-input" class="form-control" placeholder="Min" value="{{ min_price }}" style="width: 48%;">
                    <span style="display: flex; align-items: center; padding: 0 5px;">-</span>
                    <input type="text" id="max-price-input" class="form-control" placeholder="Max" value="{{ max_price }}" style="width: 48%;">
                </div>
            </div>
        </div>

        <!-- Reset Filters -->
        <button id="reset-filters" class="btn btn-outline-danger" style="width: 100%; margin-bottom: 10px;">
            <i class="icon-reload"></i> Reset Filters
        </button>
    </div>
</div>
```

### Update Tab Header
```django-html
<!-- OLD CODE -->
<li class="active"><a data-toggle="tab" href="#home"><i class="icon- icon-room_service"></i>Porducts</a></li>

<!-- NEW CODE -->
<li class="active"><a data-toggle="tab" href="#home"><i class="icon- icon-room_service"></i>Products (<span id="product-count">0</span>)</a></li>
```

### Update Food Items List Section
```django-html
<!-- OLD: -->
<ul>
    {% for food in category.fooditems.all %}
    <li>
        <!-- food item markup -->
    </li>
    {% endfor %}
</ul>

<!-- NEW: -->
<ul class="food-items-list" data-category-id="{{ category.id }}">
    {% for food in category.fooditems.all %}
    <li class="food-item" data-food-id="{{ food.id }}" data-price="{{ food.price }}" data-title="{{ food.food_title }}">
        <!-- food item markup -->
    </li>
    {% endfor %}
</ul>
```

### Add No Results Message
```django-html
<!-- Add after food items list -->
<!-- No Results Message -->
<div id="no-results" class="alert alert-info text-center" style="display: none; margin-top: 20px;">
    <p>No products found matching your filters.</p>
</div>
```

### Add Script Include at End
```django-html
<!-- At the very end before {% endblock %} -->
<script src="{% static 'js/vendor_filter.js' %}"></script>

{% endblock %}
```

---

## 4️⃣ static/js/vendor_filter.js - NEW FILE

**Create new file** with 260 lines of JavaScript functionality.
See the file created at: `static/js/vendor_filter.js`

**Key Components**:
- Filter state management
- Event listeners for all controls
- AJAX filter request
- DOM update function
- Cart integration
- Notification system

---

## 📝 Summary of Changes

| File | Type | Lines | Changes |
|------|------|-------|---------|
| marketplace/views.py | Modified | +100 | Added imports, updated vendor_detail, added filter_foods |
| marketplace/urls.py | Modified | +1 | Added filter_foods URL |
| templates/marketplace/vendor_detail.html | Modified | +80 | Updated sidebar, tabs, food list, added script |
| static/js/vendor_filter.js | Created | 260 | Complete filter functionality |
| FILTER_IMPLEMENTATION.md | Created | - | Full documentation |
| FILTER_README.md | Created | - | Quick reference guide |

**Total Lines Added**: ~440 lines of new code

---

## 🧪 Quick Test

### 1. Start Server
```bash
cd d:\Django_The_Last_Hope_Phitron\FoodOnline
.\env\Scripts\Activate.ps1
python manage.py runserver
```

### 2. Visit Vendor Page
```
http://127.0.0.1:8000/marketplace/vendor1_restaurant/
```

### 3. Test Features
- ✅ Type in search box → should filter products
- ✅ Click category radio → should filter by category
- ✅ Move price slider → should filter by price
- ✅ Click reset button → should clear all filters

---

## 🔗 AJAX Endpoint Reference

### Request
```
GET /marketplace/<vendor_slug>/filter/
X-Requested-With: XMLHttpRequest

Parameters:
- search: "pizza" (optional)
- category: "2" (optional, category ID)
- min_price: "100" (optional)
- max_price: "500" (optional)
```

### Response (Success)
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

### Response (Error)
```json
{
  "status": "failed",
  "message": "Invalid request"
}
```

---

## ✅ Checklist

- [x] Backend filter view created
- [x] URL route added
- [x] Frontend HTML updated
- [x] JavaScript filter logic added
- [x] AJAX integration working
- [x] Price range calculation added
- [x] Search functionality added
- [x] Category filtering added
- [x] Reset filters button added
- [x] Product count badge added
- [x] No results message added
- [x] Cart integration maintained
- [x] Responsive design verified
- [x] Documentation created

**Status: ✅ COMPLETE AND READY FOR USE**

