import {Injectable} from '@angular/core';
import {cordova, IonicNativePlugin} from '@ionic-native/core';

@Injectable({
    providedIn: 'root'
})
export class GeofenceFmService extends IonicNativePlugin {
    static pluginName = 'GeofenceFM';
    static plugin = 'cordova-plugin-geofence-fm';
    static pluginRef = 'GeofenceFM';
    static repo = 'https://github.com/ja1mecc/ionic-cordova-geofence-fm.git';
    static platforms = ['Android', 'iOS'];

    init(): Promise<any> {
        return cordova(this, 'init', {}, []);
    }

    addOrUpdateFence(args: any[]): Promise<any> {
        console.log(JSON.stringify(args));
        return cordova(this, 'addOrUpdateFence', {}, [args]);
    }
}
