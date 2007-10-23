# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />
<%namespace file="/systems/configuration/cfgTree.mako" name="cfgTree"/>

<%def name="head_tags()">
<style>
 table.split {
  width : 95%;
  margin-right : auto;
  margin-left : auto;
 }
 table.split td.pageOptions
 {
  width : 20%;
  vertical-align : top;
  text-align : right;
 }
 ul.pageOptions {
  padding : 10px;
  border : 1px solid #AAA;
  background-color : #FFD;
 }
 div#treeContainer a {
  color : #000;
 }
</style>
${cfgTree.head_tags()}
</%def>

<table class='split'>
 <tr>
  <td class='pageTree'>  
   ${cfgTree.treeAnchor()}
  </td>
  <td class='pageOptions'>
   <ul class='pageOptions'>
    <li>${h.link_to( "Reset configuration", url = h.url_for( action='resetConfigurationToRemote' ) )}</li>
    <li>${h.link_to( "Commit configuration", url = h.url_for( action='commitConfiguration' ) )}</li>
   </ul>
   <ul id='console'>
   </ul>
  </td>
 </tr>
</table>
