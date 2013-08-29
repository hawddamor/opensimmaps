<?php
//Creates XML string and XML document using the DOM 
$dom = domxml_new_doc('1.0'); 

$map = $dom->create_element('root');
$map = $dom->append_child($map);

$test1 = $dom->create_element('Map');
$test1 = $map->append_child($test1);

$test1 = $dom->dump_mem(true); // put string in test1 
$test1 = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Map>
  <Grid>
    <Uuid>28eda4eb-db59-493b-8361-a3fb6a55a4d7</Uuid>
    <RegionName>One</RegionName>
    <LocX>1000</LocX>
    <LocY>1001</LocY>
  </Grid>
  <Grid>
    <Uuid>6949f2bb-a037-4463-a636-da1e71542518</Uuid>
    <RegionName>Two</RegionName>
    <LocX>1001</LocX>
    <LocY>1001</LocY>
  </Grid>
  <Grid>
    <Uuid>82cea56c-bbaf-4576-bf70-92c9a4c3a2e3</Uuid>
    <RegionName>Three</RegionName>
    <LocX>1000</LocX>
    <LocY>1000</LocY>
  </Grid>
  <Grid>
    <Uuid>a2893b85-0686-4836-9506-9cd0cc4abff4</Uuid>
    <RegionName>Four</RegionName>
    <LocX>1001</LocX>
    <LocY>1000</LocY>
  </Grid>
  <Grid>
    <Uuid>ab346fcc-7898-4078-9e10-93fc77453654</Uuid>
    <RegionName>Five</RegionName>
    <LocX>5000</LocX>
    <LocY>5000</LocY>
  </Grid>
  <Grid>
    <Uuid>f658ce9e-058c-4b58-924e-fd95658cc33c</Uuid>
    <RegionName>Six</RegionName>
    <LocX>5001</LocX>
    <LocY>5000</LocY>
  </Grid>
</Map>
";
header("Content-type: text/xml");
echo $test1;
