// Simplified Vendor Detail Page Script
// Handles shopping cart operations only

$(document).ready(function() {
    console.log('✓ Vendor filter script loaded');

    // Add to Cart Handler (using event delegation for dynamic content)
    $(document).on('click', '.add_to_cart', function(e) {
        e.preventDefault();
        console.log('Add to cart button clicked');

        const food_id = $(this).attr('data-food-id');
        const url = '/cart/add-to-cart/' + food_id + '/';
        const quantity = $(this).closest('.food-item').find('.food_qty').val();

        console.log('Food ID:', food_id);
        console.log('URL:', url);
        console.log('Quantity:', quantity);

        $.ajax({
            type: 'GET',
            url: url,
            data: {
                qty: quantity
            },
            success: function(response) {
                console.log('✓ Added to cart successfully');
                console.log('Response:', response);
                
                // Update cart count
                if (response.cart_count !== undefined) {
                    $('#cart-count').text(response.cart_count);
                    console.log('Cart count updated to:', response.cart_count);
                }

                // Show success feedback
                toastr.success('Item added to cart!', '', {
                    positionClass: 'toast-top-right',
                    timeOut: 1000
                });
            },
            error: function(error) {
                console.log('✗ Error adding to cart');
                console.log('Error response:', error);
                
                toastr.error('Error adding to cart', '', {
                    positionClass: 'toast-top-right',
                    timeOut: 1000
                });
            }
        });
    });

    // Decrease Cart Item Handler
    $(document).on('click', '.decrease_cart', function(e) {
        e.preventDefault();
        console.log('Decrease cart button clicked');

        const food_id = $(this).attr('data-food-id');
        const url = '/cart/decrease-cart/' + food_id + '/';

        console.log('Food ID:', food_id);
        console.log('URL:', url);

        $.ajax({
            type: 'GET',
            url: url,
            success: function(response) {
                console.log('✓ Decreased from cart successfully');
                console.log('Response:', response);
                
                // Update cart count
                if (response.cart_count !== undefined) {
                    $('#cart-count').text(response.cart_count);
                    console.log('Cart count updated to:', response.cart_count);
                }

                // Show success feedback
                toastr.success('Item removed from cart!', '', {
                    positionClass: 'toast-top-right',
                    timeOut: 1000
                });
            },
            error: function(error) {
                console.log('✗ Error decreasing cart');
                console.log('Error response:', error);
                
                toastr.error('Error removing from cart', '', {
                    positionClass: 'toast-top-right',
                    timeOut: 1000
                });
            }
        });
    });
});
