
<!DOCTYPE html>
<!--
Listens for any click event and gives you facebook cat
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
	<iframe src="https://dev4-view.cerosdev.com/ceros-qa/component-clicked" style="position:absolute;width:1024px;height:100%;top:0;left:0;bottom:0;right:0;margin:0;padding:0;border:0 none" frameborder="0" class="ceros-experience"></iframe>
</div>

</body>

<script>
CerosSDK.findExperience('issue-551411b5b3257')
      .done(function(experience){
      	  $("#experienceTitle").html(experience.getTitle());
        
        var componentClickedCallback = function(componentCollection) {
            $("#eventFlasher").html("<img src='http://fc03.deviantart.net/fs71/f/2010/179/6/b/Lol_Cat_Computer_by_strongbad_joe132.jpg'>").fadeIn(2000).fadeOut(5000);
        }; 
        experience.subscribe(CerosSDK.EVENTS.COMPONENT_CLICKED, componentClickedCallback);

      });
</script>
</html>

