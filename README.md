# react-native-mediapipe

MediaPipe pose detection for bare React Native apps on iOS and Android.

Expo is not supported.

## Requirement
* React Native 0.87.x
* Node.js 22 or higher
* iOS 15.1 or higher
* Android minSdk 24 or higher


## Installation
```
npm install react-native-mediapipe
```

## iOS setup
1. Add camera usage permission in Info.plist in example/ios
    ```
    <key>NSCameraUsageDescription</key>
	<string>This app uses camera to get pose landmarks that appear in the camera feed.</string>
    ```

2. Add the CocoaPods CDN source at the top of your `ios/Podfile`:
    ```ruby
    source 'https://cdn.cocoapods.org/'
    ```

3. Run ```cd ios && pod install```

> **Note:** The `MediaPipeTasksVision` dependency is pinned in this library. If `pod search MediaPipeTasksVision` returns no results, the pod resolves via the CDN source above.
> ```ruby
> pod 'MediaPipeTasksVision', '1.0.0'
> ```


## Android setup
Add these to your project's manifest.

```
<uses-feature android:name="android.hardware.camera" />
<uses-permission android:name="android.permission.CAMERA" />
```

## Props

| Prop        | Description                                                                                     |
|-------------|-------------------------------------------------------------------------------------------------|
| `width`     | Sets the camera view width.                                                                      |
| `height`    | Sets the camera view height.                                                                     |
| `onLandmark`| Callback function to retrieve body landmark data.                                                |
| `frameLimit`| set the frame rate during initialization(ios only).                                              |
| `face`      | Toggles visibility of the face in the body model. Affects the data provided by `onLandmark`.      |
| `leftArm`   | Toggles visibility of the left arm in the body model. Affects the data provided by `onLandmark`.  |
| `rightArm`  | Toggles visibility of the right arm in the body model. Affects the data provided by `onLandmark`. |
| `leftWrist` | Toggles visibility of the left wrist in the body model. Affects the data provided by `onLandmark`.|
| `rightWrist`| Toggles visibility of the right wrist in the body model. Affects the data provided by `onLandmark`.|
| `torso`     | Toggles visibility of the torso in the body model. Affects the data provided by `onLandmark`.     |
| `leftLeg`   | Toggles visibility of the left leg in the body model. Affects the data provided by `onLandmark`.  |
| `rightLeg`  | Toggles visibility of the right leg in the body model. Affects the data provided by `onLandmark`. |
| `leftAnkle` | Toggles visibility of the left ankle in the body model. Affects the data provided by `onLandmark`.|
| `rightAnkle`| Toggles visibility of the right ankle in the body model. Affects the data provided by `onLandmark`.|


## Usage

### Basic

```js
import { RNMediapipe } from 'react-native-mediapipe';

export default function App() {

    return (
        <View>
            <RNMediapipe 
                width={400}
                height={300}
            />
        </View>
    )
}
```

### Usage with body prop

#### Used to show/hide any body part overlay
#### By default, the body prop is set to true

```js
import { RNMediapipe } from 'react-native-mediapipe';

export default function App() {

    return (
        <View>
            <RNMediapipe 
                width={400}
                height={300}
                face={true}
                leftArm={true}
                rightArm={true}
                leftWrist={true}
                rightWrist={true}
                torso={true}
                leftLeg={true}
                rightLeg={true}
                leftAnkle={true}
                rightAnkle={true}
            />
        </View>
    )
}
```

### Usage with switch camera method

```js
import { RNMediapipe, switchCamera } from 'react-native-mediapipe';

export default function App() {

    const onFlip = () => {
        switchCamera();
    };

    return (
        <View>
            <RNMediapipe 
                width={400}
                height={300}
            />

            <TouchableOpacity onPress={onFlip} style={styles.btnView}>
                <Text style={styles.btnTxt}>Switch Camera</Text>
            </TouchableOpacity>
        </View>
    )
}

```

### Usage with onLandmark prop

```js
import { RNMediapipe } from 'react-native-mediapipe';

export default function App() {

    return (
        <View>
            <RNMediapipe 
                width={400}
                height={300}
                onLandmark={(data) => {
                    console.log('Body Landmark Data:', data);
                }}
            />
        </View>
    )
}

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

---

## License

This project is licensed under the terms in [LICENSE](LICENSE).
