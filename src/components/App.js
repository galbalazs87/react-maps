import React, { Component } from "react";
import LocationList from "./LocationList";

class App extends Component {
  /**
   * This is a contructor
   */
  constructor(props) {
    super(props);
    this.state = {
      alllocations: require("./places.json"), // This JSON contains the locations of my choice for the map
      map: "",
      infowindow: "",
      prevmarker: ""
    };

    // Object instance retaining when used in function
    this.initMap = this.initMap.bind(this);
    this.openInfoWindow = this.openInfoWindow.bind(this);
    this.closeInfoWindow = this.closeInfoWindow.bind(this);
  }

  componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    loadMapJS(
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDCvoJkqI0DRibWfcrhCy-ffe4laKHFiAY&callback=initMap"
    );
  }

  /**
   * The map on site is initialized when the Google Maps script has been loaded
   */
  initMap() {
    var self = this;

    var mapview = document.getElementById("map");
    mapview.style.height = window.innerHeight + "px";
    var map = new window.google.maps.Map(mapview, {
      center: { lat: 48.225497, lng: 22.070270 },
      zoom: 16,
      mapTypeControl: false
    });

    var InfoWindow = new window.google.maps.InfoWindow({});

    window.google.maps.event.addListener(InfoWindow, "closeclick", function() {
      self.closeInfoWindow();
    });

    this.setState({
      map: map,
      infowindow: InfoWindow
    });

    window.google.maps.event.addDomListener(window, "resize", function() {
      var center = map.getCenter();
      window.google.maps.event.trigger(map, "resize");
      self.state.map.setCenter(center);
    });

    window.google.maps.event.addListener(map, "click", function() {
      self.closeInfoWindow();
    });

    var alllocations = [];
    this.state.alllocations.forEach(function(location) {
      var longname = location.name + " - " + location.type;
      var marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(
          location.latitude,
          location.longitude
        ),
        animation: window.google.maps.Animation.DROP,
        map: map
      });

      marker.addListener("click", function() {
        self.openInfoWindow(marker);
      });

      location.longname = longname;
      location.marker = marker;
      location.display = true;
      alllocations.push(location);
    });
    this.setState({
      alllocations: alllocations
    });
  }

  /**
   * For the marker opens a little window
   * @param {object} location marker
   */
  openInfoWindow(marker) {
    this.closeInfoWindow();
    this.state.infowindow.open(this.state.map, marker);
    marker.setAnimation(window.google.maps.Animation.BOUNCE);
    this.setState({
      prevmarker: marker
    });
    this.state.infowindow.setContent("Loading Data...");
    this.state.map.setCenter(marker.getPosition());
    this.state.map.panBy(0, -200);
    this.getMarkerInfo(marker);
  }

  /**
   * Retrieving the needed location date from the Foursquare API
   */
  getMarkerInfo(marker) {
    var self = this;

    // Needed API keys from Foursquare
    var clientId = "4L1Y2HLM2URA5QQ5JOAKSRKR0UJ4GR0C1N52XX2LPLFLPX5E";
    var clientSecret = "F5P3UFDCB5J0KKQ0W1TPPW0ZHWSV0L5U2Y3SCVTLOJS24NWN";

    // Endpoint coded by the help of the documentation of the Foursquare API
    var url =
      "https://api.foursquare.com/v2/venues/search?client_id=" +
      clientId +
      "&client_secret=" +
      clientSecret +
      "&v=20130815&ll=" +
      marker.getPosition().lat() +
      "," +
      marker.getPosition().lng() +
      "&limit=1";
    fetch(url)
      .then(function(response) {
        if (response.status !== 200) {
          self.state.infowindow.setContent("Sorry data can't be loaded");
          return;
        }

        // Getting the response from the API
        response.json().then(function(data) {
          console.log(data);

          var location_data = data.response.venues[0];
          var place = `<h3>${location_data.name}</h3>`;
          var street = `<p>${location_data.location.formattedAddress[0]}</p>`;
          var contact = "";
          if (location_data.contact.phone)
            contact = `<p><small>${location_data.contact.phone}</small></p>`;
          var checkinsCount =
            "<b>Number of CheckIn: </b>" +
            location_data.stats.checkinsCount +
            "<br>";
          var readMore =
            '<a href="https://foursquare.com/v/' +
            location_data.id +
            '" target="_blank">Read More on <b>Foursquare Website</b></a>';
          self.state.infowindow.setContent(
            place + street + contact + checkinsCount + readMore
          );
        });
      })
      .catch(function(err) {
        self.state.infowindow.setContent("Sorry data can't be loaded");
      });
  }

  /**
   * Function to close the previously opened little window
   *
   * @memberof App
   */
  closeInfoWindow() {
    if (this.state.prevmarker) {
      this.state.prevmarker.setAnimation(null);
    }
    this.setState({
      prevmarker: ""
    });
    this.state.infowindow.close();
  }

  /**
   * React Rendering
   */
  render() {
    return (
      <div>
        <LocationList
          key="100"
          alllocations={this.state.alllocations}
          openInfoWindow={this.openInfoWindow}
          closeInfoWindow={this.closeInfoWindow}
        />
        <div id="map" />
      </div>
    );
  }
}

export default App;

/**
 * Google Maps loading
 * @param {src} url of the Google Maps
 */
function loadMapJS(src) {
  var ref = window.document.getElementsByTagName("script")[0];
  var script = window.document.createElement("script");
  script.src = src;
  script.async = true;
  script.onerror = function() {
    document.write("Google Maps can't be loaded");
  };
  ref.parentNode.insertBefore(script, ref);
}