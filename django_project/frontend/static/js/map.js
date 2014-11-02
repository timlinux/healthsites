window.MAP = (function () {
    "use strict";
    // private variables and functions

    // Fix for https://github.com/Leaflet/Leaflet/issues/766
    L.Icon.Default.imagePath = '/static/js/images/';

    // constructor
    var module = function () {
        // create a map in the "map" div, set the view to a given place and zoom
        this.MAP = L.map('map').setView([0, 0], 3);

        // add an OpenStreetMap tile layer
        var hdm = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.MAP);

        var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        });

        var baseLayers = {
            "Humanitarian Style": hdm,
            "OpenStreetMap": osm
        };

        // enable Layer control
        L.control.layers(baseLayers).addTo(this.MAP);

        this.redIcon = L.icon({
            iconUrl:'/static/js/images/marker-icon-red.png',
            iconRetinaUrl:'/static/js/images/marker-icon-2x-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        this.MAP.attributionControl.setPrefix(''); // Don't show the 'Powered by Leaflet' text.

        // add markers layer
        this._setupMakersLayer();

        // add point layer
        this._setupPointLayer();

        // add newLocalityLayer
        this._setupNewLocalityLayer();

        //bind external events
        this._bindExternalEvents();
        this._bindInternalEvents();

    }

    // prototype
    module.prototype = {
        constructor: module,

        _bindInternalEvents: function() {
            var self = this;
            this.MAP.on('draw:created', function (evt) {
                self.newLocalityLayerMarker = evt.layer;
                self.MAP.addLayer(self.newLocalityLayerMarker);
                // activate edit state
                self.markerEditControl = new L.Edit.Marker(evt.layer, self.drawControl.options);
                self.markerEditControl.enable();

                $APP.trigger('map.new_locality.point');
            })
        },

        _bindExternalEvents:function () {
            var self = this;

            $APP.on('map.update-maker.location', function (evt, payload) {
                // update marker position
                self.lastClickedMarker.position['lat'] = payload.latlng[0];
                self.lastClickedMarker.position['lng'] = payload.latlng[1];
            });

            $APP.on('locality.created', function (evt, payload) {
                var marker = new PruneCluster.Marker(
                    payload.latlng[0], payload.latlng[1],
                    {'id': payload.loc_id}
                );

                self.localitiesLayer.RegisterMarker(marker);
                self.localitiesLayer.ProcessView();
            });

            $APP.on('map.show.point', function (evt, payload) {
                self.original_marker_position = [payload.geom[0], payload.geom[1]];

                self.pointLayer.setLatLng(self.original_marker_position);
                self.MAP.addLayer(self.pointLayer);

                // remove maker and processView
                if (self.lastClickedMarker) {
                    self.localitiesLayer.RemoveMarkers([self.lastClickedMarker]);
                    self.localitiesLayer.ProcessView();
                }
            });

            $APP.on('map.cancel.edit', function (evt) {
                // user clicked cancel while updating Locality
                self.pointLayer.setLatLng(self.original_marker_position);
            });

            $APP.on('map.remove.point', function (evt) {
                if (self.lastClickedMarker) {
                    self.localitiesLayer.RegisterMarker(self.lastClickedMarker);
                    self.localitiesLayer.ProcessView();
                    self.lastClickedMarker = undefined;
                }

                self.MAP.removeLayer(self.pointLayer);
                self.pointLayer.setLatLng([0,0]);
            });

            $APP.on('button.new_locality.activate', function (evt) {
                // enable markerDraw control
                self.markerDrawControl.enable();
            });

            $APP.on('button.new_locality.deactivate', function (evt) {
                // disable markerDraw control
                self.markerDrawControl.disable();

                // if edit was active revert and disable
                if (self.markerEditControl) {
                    self.markerEditControl.revertLayers();
                    self.markerEditControl.disable();

                    self.MAP.removeLayer(self.newLocalityLayerMarker);
                }
            });

            $APP.on('button.new_locality.save', function (evt) {
                self.markerEditControl.disable();
                self.MAP.removeLayer(self.newLocalityLayerMarker);

                $APP.trigger('locality.new.create', {
                    data: self.newLocalityLayerMarker.getLatLng()
                });
            });
        },

        _setupNewLocalityLayer: function () {
            this.newLocalityLayer = L.featureGroup();

            this.drawControl = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker: {
                        icon: this.redIcon
                    }
                },
                edit: {
                    featureGroup: this.newLocalityLayer
                }
            });
            // create markerDraw control
            this.markerDrawControl = new L.Draw.Marker(this.MAP, this.drawControl.options.draw.marker);
        },

        _setupPointLayer: function () {
            this.pointLayer = L.marker([0, 0], {
                'clickable': true,
                'draggable': true,
                'icon': this.redIcon
            });

            this.pointLayer.on('dragend', function (evt) {
                $APP.trigger('locality.map.move', {'latlng': evt.target._latlng});
            });
        },

        _setupMakersLayer: function () {
            var self = this;

            var geojsonSingleURL = '/localities.json';
            // read localities data
            $.getJSON(geojsonSingleURL, function (data) {
                self.localitiesLayer = new PruneClusterForLeaflet();

                self.localitiesLayer.PrepareLeafletMarker = function(leafletMarker, data, category, original_marker) {
                    leafletMarker.on('click', function () {
                        self.lastClickedMarker = original_marker;
                        $APP.trigger('locality.map.click', {'locality_id': data.id});
                    });
                };

                for (var i = data.length - 1; i >= 0; i--) {
                    var marker = new PruneCluster.Marker(
                        parseFloat(data[i]['g'][1]), parseFloat(data[i]['g'][0]),
                        {'id': data[i]['i']}
                    );

                    self.localitiesLayer.RegisterMarker(marker);

                };

                self.MAP.addLayer(self.localitiesLayer);
            })
        }
    }

    // return module
    return module;
}());
