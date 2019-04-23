import {Component, OnInit, ViewChild} from '@angular/core';
import {IonRange, Platform} from '@ionic/angular';
import {Circle, GoogleMap, GoogleMaps, GoogleMapsEvent, LatLng, Marker} from '@ionic-native/google-maps';


interface GeofenceElement {
    lat: number;
    lng: number;
    marker?: Marker;
    circle?: Circle;
}

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
    @ViewChild(IonRange) ionRange: IonRange;
    map: GoogleMap;
    modalClass = 'modal-hidden';
    private bottomModal: HTMLElement;

    private currGeofenceElement: GeofenceElement;
    private geofencesElements: Array<GeofenceElement> = [];

    constructor(private platform: Platform) {
    }

    async ngOnInit() {
        await this.platform.ready();
        await this.loadMap();
        this.bottomModal = document.getElementById('bottom-modal');
    }

    loadMap() {
        this.map = GoogleMaps.create('map_canvas', {
            camera: {
                target: {
                    lat: -33.3930,
                    lng: -70.5578
                },
                zoom: 15
            }
        });

        this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
            this.map.on(GoogleMapsEvent.MAP_LONG_CLICK).subscribe((latLng: Array<LatLng>) => {

                const marker = this.map.addMarkerSync({
                    position: {
                        lat: latLng[0].lat,
                        lng: latLng[0].lng
                    }
                });

                marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe((argsArr) => {
                    this.bottomModal.classList.add('modal-shown');
                    this.manageModalOpen(argsArr[0], argsArr[1]);
                });

                const circle = this.map.addCircleSync({
                    center: {
                        lat: latLng[0].lat,
                        lng: latLng[0].lng
                    },
                    radius: 100,
                    fillColor: '#80bfff22',
                    strokeWidth: 2,
                    strokeColor: '#3399ff'
                });

                this.geofencesElements.push({
                    lat: latLng[0].lat,
                    lng: latLng[0].lng,
                    marker,
                    circle
                });
            });

            this.map.on(GoogleMapsEvent.MAP_CLICK).subscribe(() => {
                this.bottomModal.classList.remove('modal-shown');
                this.currGeofenceElement = null;
            });

            this.map.on(GoogleMapsEvent.MAP_DRAG).subscribe(() => {
                this.bottomModal.classList.remove('modal-shown');
                this.currGeofenceElement = null;
            });
        });
    }

    private manageModalOpen(latlng: LatLng, marker: Marker) {
        const geofenceElement = this.geofencesElements.find(curr => curr.marker === marker);
        this.currGeofenceElement = geofenceElement;

        this.ionRange.value = geofenceElement.circle.getRadius();
    }

    manageModalEditRadius(event) {
        const newVal = event.detail.value;
        this.currGeofenceElement.circle.setRadius(newVal);
    }

}
