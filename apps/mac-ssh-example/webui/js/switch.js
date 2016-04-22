$(function() {
    $('.switch_toggle').click(function() {
        var value = ($(this).prop('checked')) ? 'on' : 'off';
        $(this).trigger('new_switch_value', value);
    });

    $('.switch').on('set_switch', function(e, value) {
        if (value === 'on') {
            $(this).find('.switch_toggle').prop('checked', true);
        } else if (value === 'off') {
            $(this).find('.switch_toggle').prop('checked', false);
        }
    });
});
