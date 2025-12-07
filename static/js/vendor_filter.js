// Vendor Detail Page Filter Script
// Handles search, category, and price range filtering

console.log('=== VENDOR FILTER SCRIPT STARTING ===');

$(document).ready(function() {
    console.log('✓ jQuery document.ready triggered');
    console.log('Filter script loaded');
    
    // Get vendor slug from URL
    const pathArray = window.location.pathname.split('/');
    const vendorSlug = pathArray[2];
    console.log('✓ Vendor slug extracted:', vendorSlug);
    console.log('✓ Full pathname:', window.location.pathname);
    console.log('✓ Path array:', pathArray);
    
    // Check if required elements exist
    console.log('Checking for required DOM elements:');
    console.log('  - #search-products:', $('#search-products').length ? '✓ FOUND' : '✗ MISSING');
    console.log('  - input[name="category"]:', $('input[name="category"]').length ? '✓ FOUND ('+$('input[name="category"]').length+')' : '✗ MISSING');
    console.log('  - #min-price:', $('#min-price').length ? '✓ FOUND' : '✗ MISSING');
    console.log('  - #max-price:', $('#max-price').length ? '✓ FOUND' : '✗ MISSING');
    console.log('  - #menu-item-list-6272:', $('#menu-item-list-6272').length ? '✓ FOUND' : '✗ MISSING');
    console.log('  - #product-count:', $('#product-count').length ? '✓ FOUND' : '✗ MISSING');
    
    // Initialize product count on page load
    const initialProductCount = $('#menu-item-list-6272 .food-item').length;
    $('#product-count').text(initialProductCount);
    console.log('✓ Initial product count set to:', initialProductCount);
    
    // Initialize price labels with slider values
    const minPrice = $('#min-price').val();
    const maxPrice = $('#max-price').val();
    $('#min-price-label').text(parseFloat(minPrice).toFixed(2));
    $('#max-price-label').text(parseFloat(maxPrice).toFixed(2));
    console.log('✓ Price labels initialized - Min:', minPrice, 'Max:', maxPrice);
    
    // Filter state
    let currentFilters = {
        search: '',
        category: '',
        min_price: minPrice,
        max_price: maxPrice
    };
    
    console.log('✓ Initial filters:', currentFilters);

    // EVENT: Search input
    $('#search-products').on('keyup', function() {
        currentFilters.search = $(this).val().trim();
        console.log('🔍 Search changed:', currentFilters.search);
        applyFilters();
    });

    // EVENT: Category radio buttons
    $('input[name="category"]').on('change', function() {
        currentFilters.category = $(this).val();
        console.log('📁 Category changed:', currentFilters.category);
        applyFilters();
    });

    // EVENT: Min price slider
    $('#min-price').on('input', function() {
        const minVal = parseFloat($(this).val());
        const maxVal = parseFloat($('#max-price').val());
        if (minVal <= maxVal) {
            $('#min-price-label').text(minVal.toFixed(2));
            $('#min-price-input').val(minVal.toFixed(2));
            currentFilters.min_price = minVal;
            console.log('💰 Min price changed:', minVal);
            applyFilters();
        }
    });

    // EVENT: Max price slider
    $('#max-price').on('input', function() {
        const maxVal = parseFloat($(this).val());
        const minVal = parseFloat($('#min-price').val());
        if (maxVal >= minVal) {
            $('#max-price-label').text(maxVal.toFixed(2));
            $('#max-price-input').val(maxVal.toFixed(2));
            currentFilters.max_price = maxVal;
            console.log('💰 Max price changed:', maxVal);
            applyFilters();
        }
    });

    // EVENT: Min price text input
    $('#min-price-input').on('change', function() {
        const val = parseFloat($(this).val());
        if (!isNaN(val)) {
            $('#min-price').val(val);
            $('#min-price-label').text(val.toFixed(2));
            currentFilters.min_price = val;
            applyFilters();
        }
    });

    // EVENT: Max price text input
    $('#max-price-input').on('change', function() {
        const val = parseFloat($(this).val());
        if (!isNaN(val)) {
            $('#max-price').val(val);
            $('#max-price-label').text(val.toFixed(2));
            currentFilters.max_price = val;
            applyFilters();
        }
    });

    // EVENT: Reset button
    $('#reset-filters').on('click', function(e) {
        e.preventDefault();
        console.log('🔄 Reset button clicked');
        
        $('#search-products').val('');
        $('input[name="category"]').first().prop('checked', true);
        
        const minDefault = parseFloat($('#min-price').attr('min')) || 0;
        const maxDefault = parseFloat($('#max-price').attr('max')) || 1000;
        
        $('#min-price').val(minDefault);
        $('#max-price').val(maxDefault);
        $('#min-price-label').text(minDefault.toFixed(2));
        $('#max-price-label').text(maxDefault.toFixed(2));
        $('#min-price-input').val(minDefault.toFixed(2));
        $('#max-price-input').val(maxDefault.toFixed(2));
        
        currentFilters = {
            search: '',
            category: '',
            min_price: minDefault,
            max_price: maxDefault
        };
        
        applyFilters();
    });

    // MAIN FUNCTION: Apply filters via AJAX
    function applyFilters() {
        const filterUrl = `/marketplace/${vendorSlug}/filter/`;
        
        console.log('Applying filters:', {
            url: filterUrl,
            filters: currentFilters
        });
        
        $.ajax({
            type: 'GET',
            url: filterUrl,
            data: {
                search: currentFilters.search,
                category: currentFilters.category,
                min_price: currentFilters.min_price,
                max_price: currentFilters.max_price
            },
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: 'json',
            success: function(response) {
                console.log('Filter response:', response);
                if (response.status === 'success') {
                    displayFoods(response.foods, response.count);
                } else {
                    console.error('Filter failed:', response);
                    showAlert('Error filtering products', 'danger');
                }
            },
            error: function(error) {
                console.error('Filter AJAX error:', error);
                showAlert('Error loading filtered results', 'danger');
            }
        });
    }

    // FUNCTION: Display filtered foods
    function displayFoods(foods, count) {
        const container = $('#menu-item-list-6272');
        container.empty();
        
        $('#product-count').text(count);
        console.log(`Displaying ${count} products`);
        
        if (foods.length === 0) {
            container.html(`
                <div class="alert alert-info text-center" style="margin: 30px 0; padding: 30px;">
                    <h5>No Products Found</h5>
                    <p>Try adjusting your filters or search terms.</p>
                </div>
            `);
            return;
        }

        let html = '';
        foods.forEach(function(food) {
            // Get quantity from existing cart items if they exist
            let qty = 0;
            const existingQtyEl = $(`#qty-${food.id}.item_qty`);
            if (existingQtyEl.length) {
                qty = existingQtyEl.attr('data-qty') || 0;
            }
            
            html += `
                <li class="food-item" data-food-id="${food.id}" data-price="${food.price}" data-title="${food.title}">
                    <div class="image-holder">
                        <img src="${food.image}" alt="${food.title}">
                    </div>
                    <div class="text-holder">
                        <h6>${food.title}</h6>
                        <span>${food.description || ''}</span>
                    </div>
                    <div class="price-holder">
                        <span class="price">${food.price} Bdt</span>
                        <a href="#" class="decrease_cart" data-id="${food.id}" data-url="/marketplace/decrease_cart/${food.id}/" style="margin-right: 28px;">
                            <i class="icon-minus text-color"></i>
                        </a>
                        <label id="qty-${food.id}">${qty}</label>
                        <a href="#" class="add_to_cart" data-id="${food.id}" data-url="/marketplace/add_to_cart/${food.id}/">
                            <i class="icon-plus4 text-color"></i>
                        </a>
                    </div>
                </li>
            `;
        });

        container.html(html);
        // Don't attach handlers here - let custom.js handle them
        // Just delegate to existing handlers
        attachCartHandlers();
    }

    // FUNCTION: Attach cart button handlers (delegate to custom.js handlers)
    function attachCartHandlers() {
        // Rebind existing event handlers from custom.js
        // This ensures the dynamically added elements get the same handlers
        
        // Add to cart handler
        $(document).off('click', '#menu-item-list-6272 .add_to_cart').on('click', '#menu-item-list-6272 .add_to_cart', function(e) {
            e.preventDefault();
            const foodId = $(this).attr('data-id');
            const url = $(this).attr('data-url');
            
            $.ajax({
                type: 'GET',
                url: url,
                success: function(response){
                    console.log(response)
                    if(response.status == 'login_required'){
                        swal(response.message, '', 'info').then(function(){
                            window.location = '/accounts/login/';
                        })
                    }else if(response.status == 'Failed'){
                        swal(response.message, '', 'error') 
                    }else{
                        $('#cart_counter').html(response.cart_counter['cart_count']);
                        $('#qty-'+foodId).html(response.qty);
                        applyCartAmounts(
                            response.cart_amount['subtotal'],
                            response.cart_amount['tax_dict'],
                            response.cart_amount['grand_total']
                        )
                    }
                }
            })
        });

        // Decrease cart handler
        $(document).off('click', '#menu-item-list-6272 .decrease_cart').on('click', '#menu-item-list-6272 .decrease_cart', function(e) {
            e.preventDefault();
            const foodId = $(this).attr('data-id');
            const url = $(this).attr('data-url');
            
            $.ajax({
                type: 'GET',
                url: url,
                success: function(response){
                    console.log(response)
                    if(response.status == 'login_required'){
                        swal(response.message, '', 'info').then(function(){
                            window.location = '/accounts/login/';
                        })
                    }else if(response.status == 'Failed'){
                        swal(response.message, '', 'error') 
                    }else{
                        $('#cart_counter').html(response.cart_counter['cart_count']);
                        $('#qty-'+foodId).html(response.qty);
                        applyCartAmounts(
                            response.cart_amount['subtotal'],
                            response.cart_amount['tax_dict'],
                            response.cart_amount['grand_total']
                        )
                    }
                }
            })
        });
    }

    console.log('Filter initialization complete');
});
