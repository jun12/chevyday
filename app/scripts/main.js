$('#items li').swipe(function(){
  $('.delete').hide();
  $('.delete', this).show();
})

// delete row on tapping delete button
$('.delete').tap(function(){
  $(this).parent('li').remove();
})