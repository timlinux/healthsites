DROP TABLE IF EXISTS merge;
CREATE TABLE merge AS
--SELECT
--	wkb_geometry AS geom, 'n' || osm_id AS osm_id, osm_timestamp, amenity, name, other_tags
--FROM points
--UNION
SELECT
	ST_PointOnSurface(wkb_geometry) AS geom, 'r' || osm_id AS osm_id, osm_timestamp, amenity, name, other_tags
FROM multipolygons
WHERE osm_way_id IS NULL AND ST_IsValid(wkb_geometry) = True
UNION
SELECT ST_PointOnSurface(wkb_geometry) AS geom, 'w' || osm_way_id AS osm_id, osm_timestamp, amenity, name, other_tags
FROM multipolygons
WHERE osm_id IS NULL AND ST_IsValid(wkb_geometry) = True;

DROP TABLE IF EXISTS cleaning;
CREATE TABLE cleaning AS
SELECT
	'' AS uuid,
	ST_X(geom) AS X, ST_Y(geom) AS Y, geom,
	osm_id, osm_timestamp AS date_modified, amenity AS nature,
	concat_ws(', ', name, SUBSTRING(other_tags FROM '\"name:en\"\=\>\"([ A-Za-z0-9]+)\"')) AS name,
	SUBSTRING(other_tags FROM '\"network:type\"\=\>\"([ A-Za-z0-9]+)\"') AS ownership,
	SUBSTRING(other_tags FROM '\"opening:hours\"\=\>\"([ A-Za-z0-9]+)\"') AS operation,
	COALESCE (
		SUBSTRING(other_tags FROM '\"email\"\=\>\"([A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+)\"'),
		SUBSTRING(other_tags FROM '\"contact:email\"\=\>\"([A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+)\"')
		) AS  email,
	COALESCE(
		SUBSTRING(other_tags FROM '\"phone\"\=\>\"([:\/ \.A-Za-z0-9]+)\"'),
		SUBSTRING(other_tags FROM '\"contact:phone\"\=\>\"([:\/ \.A-Za-z0-9]+)\"')
		) AS phone,
	COALESCE(
		SUBSTRING(other_tags FROM '\"website\"\=\>\"([:\/ \.A-Za-z0-9]+)\"'),
		SUBSTRING(other_tags FROM '\"contact:website\"\=\>\"([:\/ \.A-Za-z0-9]+)\"')
		) AS website,
	concat_ws(', ',
		SUBSTRING(other_tags FROM '\"addr:housenumber\"\=\>\"([ A-Za-z0-9]+)\"'),
		SUBSTRING(other_tags FROM '\"addr:street\"\=\>\"([ A-Za-z0-9]+)\"'),
		SUBSTRING(other_tags FROM '\"addr:city\"\=\>\"([ A-Za-z0-9]+)\"'),
		COALESCE(
			SUBSTRING(other_tags FROM '\"addr:postcode\"\=\>\"([ A-Za-z0-9]+)\"'),
			SUBSTRING(other_tags FROM '\"postal_code\"\=\>\"([ A-Za-z0-9]+)\"')
		)
	) AS address,
	'OpenStreetMap' AS data_source
FROM merge;