<!DOCTYPE html>
<!--
Listens for any page change event and gives you tech support cat
-->

<html>
<head>
<script src="../embedded-player-sdk.js"></script>
<script src="https://code.jquery.com/jquery-1.11.2.min.js"></script>
</head>
<body>
<h1><div id="experienceTitle"></div></h1>

<div id="eventFlasher"></div>


<div style="position:relative;width:auto;padding:0 0 75.00%;height:0;top:0;left:0;bottom:0;right:0;margin:0;border:0 none">
    <iframe src="https://dev4-view.cerosdev.com/ceros-qa/page-change" style="position:absolute;width:1024px;height:100%;top:0;left:0;bottom:0;right:0;margin:0;padding:0;border:0 none" frameborder="0" class="ceros-experience"></iframe>
</div>

</body>

<script>
CerosSDK.findExperience('issue-551370f2ecad8')
     .done(function(experience){
           $("#experienceTitle").html(experience.getTitle());
       
      var pageChangedCallback = function(pageCollection) {
           $("#eventFlasher").html("<img src='https://wordandimage.files.wordpress.com/2008/04/pctechsupportcat.jpg?w=900&h=600'>").fadeIn(2000).fadeOut(4000);
       };

       experience.subscribe(CerosSDK.EVENTS.PAGE_CHANGE, pageChangedCallback);

     })
     .fail(function(error){
         console.log(error);
     });
</script>
</html>