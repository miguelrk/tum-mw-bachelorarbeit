<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:json="http://json.org/"
  xmlns:xmi="http://www.omg.org/spec/XMI/20131001"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:Blocks="http://www.eclipse.org/papyrus/sysml/1.4/SysML/Blocks"
  xmlns:SfmPrf="http:///schemas/SfmPrf/_fa42UPqgEee-J57XhZlntA/10"
  xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
  xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML"
  xsi:schemaLocation="http://www.eclipse.org/papyrus/sysml/1.4/SysML/Blocks http://www.eclipse.org/papyrus/sysml/1.4/SysML#//blocks http:///schemas/SfmPrf/_fa42UPqgEee-J57XhZlntA/10 ../de.gefasoft.mbse.sfm.prf/SfmPrf.update.profile.uml#_fa-V4PqgEee-J57XhZlntA">

 <xsl:output indent="no" omit-xml-declaration="yes" method="text" encoding="utf-8"/>

  <xsl:strip-space elements="*"/>

  <xsl:template match="/">{
	"nodes": [<xsl:variable name="rNodeId" select="//*[name(.)='SfmPrf:IH']/@base_Class"/>
	<xsl:variable name="rNode" select="//*[@xmi:type='uml:Class' and @xmi:id=$rNodeId]"/>
	<xsl:apply-templates select = "$rNode//*[@xmi:type='uml:Class']"/>],
	"properties":[<xsl:apply-templates select = "$rNode//*[@xmi:type='uml:Property']"/>
	]
  }</xsl:template>

	<xsl:template match="packagedElement[@xmi:type='uml:Class']"><xsl:call-template name="umlClassTemplate"/></xsl:template>

	<xsl:template match="nestedClassifier[@xmi:type='uml:Class']"><xsl:call-template name="umlClassTemplate"/></xsl:template>

	<xsl:template match="ownedAttribute[@xmi:type='uml:Property']"><xsl:call-template name="umlPropertyTemplate"/><xsl:if test="position()!=last()">,</xsl:if></xsl:template>

	<xsl:template name="umlClassTemplate">
		<xsl:variable name="classId" select="./@xmi:id"/>
		{
			"modelId":"<xsl:value-of select="$classId"/>",
			"dbId":"",
			"name":"<xsl:value-of select="./@name"/>",
			"zusätzlichesAttribut":"<xsl:value-of select="./@drawIOComponenent"/>",
			"xmiType":"<xsl:value-of select="./@xmi:type"/>",
			"appliedStereotypes":[<xsl:for-each select="/xmi:XMI/*[@base_Class=$classId]">"<xsl:value-of select="name(.)"/>"<xsl:if test="position()!=last()">,</xsl:if>
			</xsl:for-each>],
			"isaLevel":"<xsl:for-each select="(/xmi:XMI/*[@base_Class=$classId and contains('SfmPrf:Enterprise,SfmPrf:Site,SfmPrf:Area,SfmPrf:Cell,SfmPrf:Unit,SfmPrf:EModule,SfmPrf:CModule',name(.))])"><xsl:if test="position()=1"><xsl:value-of select="substring-after(name(.),':')"/></xsl:if></xsl:for-each>",
			"parent":{
				"modelId":"<xsl:value-of select="../@xmi:id"/>",
				"dbId":""
			},
			"children":[<xsl:for-each select="./nestedClassifier">"<xsl:value-of select="./@xmi:id"/>"<xsl:if test="position()!=last()">,</xsl:if></xsl:for-each>],
			"properties":[<xsl:for-each select="./ownedAttribute"><xsl:call-template name="umlPropertyTemplate"/><xsl:if test="position()!=last()">,</xsl:if></xsl:for-each>],
			"valPrefix":""<xsl:if test="boolean(/xmi:XMI/*[@base_Class=$classId and name(.)='SfmPrf:OpcUaServer'])">,
			"opcUAServer":{<xsl:variable name="server" select="/xmi:XMI/*[@base_Class=$classId and name(.)='SfmPrf:OpcUaServer']"/>
				"modelId":"<xsl:value-of select="$server/@xmi:id"/>",
				"connectionDbId":"",
				"name":"<xsl:value-of select="./@name"/>",
				"ipconfig":"<xsl:value-of select="$server/@ipconfig"/>",
				"address":"<xsl:value-of select="$server/@address"/>",
				"port":<xsl:value-of select="$server/@port"/>,
				"nsName":"<xsl:value-of select="$server/@nsName"/>",
				"nsPrefix":"<xsl:value-of select="$server/@nsPrefix"/>",
				"parentNode":{
					"modelId":"<xsl:value-of select="$classId"/>",
					"dbId":""
				}
			}</xsl:if>
		}<xsl:if test="position()!=last()">,</xsl:if>
	</xsl:template>

  	<xsl:template name = "umlPropertyTemplate">
		<xsl:variable name="propId" select="./@xmi:id"/>
		<xsl:variable name="varScope" select = "/xmi:XMI/*[@base_Property=$propId and name(.)='SfmPrf:VarScope']"/>
		<xsl:variable name="msgScope" select = "/xmi:XMI/*[@base_Property=$propId and name(.)='SfmPrf:MsgScope']"/>
		<xsl:variable name="sdScope" select = "/xmi:XMI/*[@base_Property=$propId and name(.)='SfmPrf:SdScope']"/>
		{
			"modelId":"<xsl:value-of select="$propId"/>",
			"dbId":"",
			"name":"<xsl:value-of select="./@name"/>",
			"xmiType":"<xsl:value-of select="./@xmi:type"/>",
			"appliedStereotypes":[<xsl:for-each select="/xmi:XMI/*[@base_Property=$propId]">"<xsl:value-of select="name(.)"/>"<xsl:if test="position()!=last()">,</xsl:if>
					</xsl:for-each>],
			"parentNode":{
				"modelId":"<xsl:value-of select="../@xmi:id"/>",
				"dbId":""
			},
			"dataType":<xsl:call-template name="umlGetType"/>,
			"defaultValue":"<xsl:call-template name="umlGetDefaultValue"/>",
			"access":"<xsl:value-of select="($varScope|$msgScope)/@access"/>",
			"address":"<xsl:value-of select="($varScope|$msgScope)/@address"/>"<xsl:if test = "boolean($msgScope)">,
			"message":"<xsl:value-of select="$msgScope/@message"/>",
			"id":<xsl:choose><xsl:when test="boolean($msgScope/@id)"><xsl:value-of select="$msgScope/@id"/></xsl:when><xsl:otherwise>0</xsl:otherwise></xsl:choose></xsl:if>
		}</xsl:template>

	<xsl:template name = "umlGetType">
		<xsl:choose>
			<xsl:when test = "contains(./type/@href,'Boolean')">"Boolean"</xsl:when>
			<xsl:when test = "contains(./type/@href,'Integer')">"Integer"</xsl:when>
			<xsl:when test = "contains(./type/@href,'Real')">"Real"</xsl:when>
			<xsl:when test = "contains(./type/@href,'String')">"String"</xsl:when>
			<xsl:when test = "boolean(./@type)">"<xsl:value-of select="./@name"/>",
			"dataTypeId":"<xsl:value-of select="./@type"/>"</xsl:when>
			<xsl:otherwise>""</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="umlGetDefaultValue">
		<xsl:choose>
			<xsl:when test="boolean(./defaultValue/@value)"><xsl:value-of select="./defaultValue/@value"/></xsl:when>
			<xsl:when test="boolean(./defaultValue/@instance)"><xsl:variable name = "instanceId" select="./defaultValue/@instance"/><xsl:value-of select="//*[@xmi:id=$instanceId]/@name"/>",
			"defaultValueId":"<xsl:value-of select="$instanceId"/></xsl:when>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>
