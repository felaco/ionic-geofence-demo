import {Component, OnInit, ViewChild} from '@angular/core';
import {IonRange, Platform} from '@ionic/angular';
import {Circle, GoogleMap, GoogleMaps, GoogleMapsEvent, LatLng, LocationService, Marker, MyLocation} from '@ionic-native/google-maps';
import {GeofenceFmService} from '../providers/geofence-fm.service';


interface CircleBackup {
    radius: number;
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
}

interface GeofenceElement {
    lat: number;
    lng: number;
    marker?: Marker;
    circle?: Circle;
    id: string;
    circleBackup: CircleBackup;
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

    constructor(
        private platform: Platform,
        private geofenceProvider: GeofenceFmService
    ) {
    }

    async ngOnInit() {
        await this.platform.ready();
        await this.geofenceProvider.init();
        await this.loadMap();
        this.bottomModal = document.getElementById('bottom-modal');
    }

    loadMap() {
        LocationService.getMyLocation().then((myLocation: MyLocation) => {
            this.map = GoogleMaps.create('map_canvas', {
                camera: {
                    target: myLocation.latLng,
                    zoom: 15
                }
            });

            this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
                this.renderPreviousFences();

                this.map.on(GoogleMapsEvent.MAP_LONG_CLICK).subscribe((latLng: Array<LatLng>) => {
                    const marker = this.addMarker(latLng[0]);
                    this.geofencesElements.push(marker);

                    this.geofenceProvider.addOrUpdateFence([{
                        id: marker.id,
                        latitud: latLng[0].lat,
                        longitud: latLng[0].lng,
                        radius: 250
                    }]);

                    localStorage.setItem('geofences', JSON.stringify(this.geofencesElements));
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
        });

    }

    private manageModalOpen(latlng: LatLng, id: string) {
        const geofenceElement = this.geofencesElements.find(curr => curr.id === id);
        this.currGeofenceElement = geofenceElement;

        this.ionRange.value = geofenceElement.circle.getRadius();
        localStorage.setItem('geofences', JSON.stringify(this.geofencesElements));
    }

    manageModalEditRadius(event) {
        const newVal = event.detail.value;
        this.currGeofenceElement.circle.setRadius(newVal);
        this.currGeofenceElement.circleBackup.radius = newVal;
        localStorage.setItem('geofences', JSON.stringify(this.geofencesElements));
    }

    manageModalMouseUp(event) {
        // console.log(event);
        this.geofenceProvider.addOrUpdateFence([{
            id: this.currGeofenceElement.id,
            latitud: this.currGeofenceElement.lat,
            longitud: this.currGeofenceElement.lng,
            radius: this.currGeofenceElement.circle.getRadius()
        }]);

        localStorage.setItem('geofences', JSON.stringify(this.geofencesElements));
    }

    private renderPreviousFences() {
        this.geofencesElements = JSON.parse(localStorage.getItem('geofences'));
        this.geofencesElements = this.geofencesElements ? this.geofencesElements : [];


        // this.geofencesElements.forEach((fence) => {
        //     this.addMarker(fence);
        // });
        this.geofencesElements = this.geofencesElements.map(fence => this.addMarker(fence));
    }

    private addMarker(latlng: LatLng | GeofenceElement): GeofenceElement {
        const marker = this.map.addMarkerSync({
            position: {
                lat: latlng.lat,
                lng: latlng.lng
            }
        });

        let radius = 250;
        let fillColor = '#80bfff22';
        let strokeColor = '#3399ff';

        if (!(latlng instanceof LatLng) && latlng.circleBackup != null) {
            radius = latlng.circleBackup.radius;
            fillColor = latlng.circleBackup.fillColor;
            strokeColor = latlng.circleBackup.strokeColor;
        }

        const circle = this.map.addCircleSync({
            center: {
                lat: latlng.lat,
                lng: latlng.lng
            },
            radius,
            fillColor,
            strokeWidth: 2,
            strokeColor
        });

        const id = latlng.lat + '|' + latlng.lng;

        marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe((argsArr) => {
            console.log(argsArr);
            this.bottomModal.classList.add('modal-shown');
            this.manageModalOpen(null, id);
        });

        return {
            lat: latlng.lat,
            lng: latlng.lng,
            marker,
            circle,
            id,
            circleBackup: {
                radius: 250,
                fillColor: '#80bfff22',
                strokeColor: circle.getStrokeColor(),
                strokeWidth: circle.getStrokeWidth()
            }
        };
    }

    removeFence() {
        if (this.currGeofenceElement != null) {
            const index = this.geofencesElements.indexOf(this.currGeofenceElement);
            this.geofencesElements = [
                ...this.geofencesElements.slice(0, index),
                ...this.geofencesElements.slice(index + 1)
            ];

            this.geofenceProvider.removeGeofence(this.currGeofenceElement.id).then(res => {

                this.currGeofenceElement.circle.remove();
                this.currGeofenceElement.marker.remove();

                console.log(this.currGeofenceElement);
                this.bottomModal.classList.remove('modal-shown');
                this.currGeofenceElement = null;

                localStorage.setItem('geofences', JSON.stringify(this.geofencesElements));

            }).catch(err => {
                console.error(err);
            });

        }
    }

    manageBlur(event) {
        console.log(event);
    }

}
