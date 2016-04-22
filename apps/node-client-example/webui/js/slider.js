(function($, window, document, undefined) {

    $.fn.slider = function(min, max, stepSize) {
        'use strict';

        if (!stepSize) stepSize = 1;

        var $slider = $(this),
            sliderWidth = $slider.outerWidth(),
            handlesArr = [],
            markersArr = [],
            sections = $slider.find('.slider_section'),
            handles = $slider.find('.slider_handle'),
            markers = $slider.find('.slider_marker'),
            getValue = function(handleNumber, position) {
                var newValue = 0;
                if (stepSize <= 1) {
                    newValue = (Math.round((position / sliderWidth) * (max - min) * (1 / stepSize)) / (1 / stepSize)) + min;
                } else {
                    newValue = (Math.round((position / sliderWidth) * (max - min) / stepSize) * stepSize) + min;
                }
                return newValue;
            },
            moveHandle = function(handleNumber, value, ignoreBoundaries) {
                var $handle = $($slider.find('.slider_handle')[handleNumber]),
                    position = ((value - min) / (max - min)) * sliderWidth;

                if (!ignoreBoundaries) {
                    if (handleNumber > 0) {
                        if (handlesArr[handleNumber - 1].position >= position) {
                            position = handlesArr[handleNumber - 1].position;
                            value = handlesArr[handleNumber - 1].value;
                        }
                    }
                    if (handleNumber < handlesArr.length - 1) {
                        if (handlesArr[handleNumber + 1].position <= position) {
                            position = handlesArr[handleNumber + 1].position;
                            value = handlesArr[handleNumber + 1].value;
                        }
                    }
                }
                if (position < 0) {
                    position = 0;
                    value = min;
                }
                if (position > $slider.outerWidth()) {
                    position = $slider.outerWidth();
                    value = max;
                }
                $handle.css('left', position - $handle.outerWidth() / 2);
                handlesArr[handleNumber] = {position: position, value: value};
                $handle.next('.handle_number')
                       .html(value)
                       .css('left', position - $handle.next('.handle_number').outerWidth() / 2);
                $handle.prevAll('.slider_section').first().css('right', $slider.outerWidth() - position);
                $handle.nextAll('.slider_section').first().css('left', position);
            },
            moveMarker = function(markerNumber, value) {
                var $marker = $($slider.find('.slider_marker')[markerNumber]),
                    position = ((value - min) / (max - min)) * sliderWidth;

                if (position < 0) {
                    position = 0;
                    value = min;
                }
                if (position > $slider.outerWidth()) {
                    position = $slider.outerWidth();
                    value = max;
                }

                $marker.css('left', position - $marker.outerWidth() / 2);
                markersArr[markerNumber] = {position: position, value: value};
                $marker.next('.marker_number')
                       .html(value)
                       .css('left', position - $marker.next('.marker_number').outerWidth() / 2);
            };

        sections.each(function(i) {
            $(this).css('left', i * (1 / sections.length) * $slider.outerWidth());
            $(this).css('right', (sections.length - i - 1) * (1 / sections.length) * $slider.outerWidth());
        });

        markers.each(function(i) {
            $(this).attr('data-number', i);
            moveMarker(i, 0);
        });

        handles.each(function(i) {
            var $handle = $(this),
                handleHalfWidth = $handle.outerWidth() / 2,
                startPosition = (i + 1) * (1 / sections.length) * $slider.outerWidth(),
                startValue = getValue(i, startPosition);

            $handle.attr('data-number', i);
            moveHandle(i, startValue);

            $handle.on('touchstart', function(e) {
                var start = e.originalEvent.touches[0].pageX,
                    handleNumber = parseInt($handle.attr('data-number'));

                e.preventDefault();

                $(document).on('touchmove', function(e) {
                    var change = e.originalEvent.touches[0].pageX - start,
                        newPosition = e.originalEvent.touches[0].pageX - $slider.offset().left;
                    start = e.originalEvent.touches[0].pageX;
                    var newValue = getValue(handleNumber, newPosition);
                    moveHandle(handleNumber, newValue);
                });

                $(document).one('touchend', function() {
                    $slider.trigger('new_slider_value', [handleNumber, handlesArr[handleNumber].value]);
                    $(document).off('touchmove');
                });
            });

            $handle.on('mousedown', function(e) {
                var start = e.pageX,
                    handleNumber = parseInt($handle.attr('data-number'));

                e.preventDefault();

                $(document).on('mousemove', function(e) {
                    var change = e.pageX - start,
                        newPosition = e.pageX - $slider.offset().left;
                    start = e.pageX;
                    var newValue = getValue(handleNumber, newPosition);
                    moveHandle(handleNumber, newValue);
                });

                $(document).one('mouseup', function() {
                    $slider.trigger('new_slider_value', [handleNumber, handlesArr[handleNumber].value]);
                    $(document).off('mousemove');
                });
            });
        });

        $slider.on('set_handle', function(e, handleNumber, value) {
            moveHandle(handleNumber, value, true);
        });

        $slider.on('set_marker', function(e, markerNumber, value) {
            moveMarker(markerNumber, value);
        });

        return this;
    };
})(jQuery, window, document);
