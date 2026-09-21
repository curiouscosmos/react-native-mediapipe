import React, { useEffect, useRef, type MutableRefObject } from 'react';
import {
  requireNativeComponent,
  UIManager,
  Platform,
  type ViewStyle,
  findNodeHandle,
  View,
  PixelRatio,
  NativeModules,
  NativeEventEmitter,
  type EmitterSubscription,
  Dimensions,
  StyleSheet,
} from 'react-native';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

const LINKING_ERROR =
  `The package 'react-native-mediapipe' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n';

type TsMediapipeProps = {
  ref?: MutableRefObject<View | null>;
  onLandmark?: (event: any) => void;
  face?: boolean;
  leftArm?: boolean;
  rightArm?: boolean;
  leftWrist?: boolean;
  rightWrist?: boolean;
  torso?: boolean;
  leftLeg?: boolean;
  rightLeg?: boolean;
  leftAnkle?: boolean;
  rightAnkle?: boolean;
  height?: number;
  width?: number;
  poseStarted?: number;
  frameLimit?: number; // ios only(set the frame rate during initialization)
};

type MediapipeComponentProps = TsMediapipeProps & {
  style?: ViewStyle;
};

const { MediaPipeNativeModule, TsMediapipeViewManager } = NativeModules;

const isAndroid = Platform.OS === 'android';

const ComponentName = isAndroid ? 'TsMediapipeViewManager' : 'TsMediapipeView';

const switchCamera = isAndroid
  ? MediaPipeNativeModule.switchCameraMethod
  : TsMediapipeViewManager.switchCamera;

const TsMediapipe =
  UIManager.getViewManagerConfig(ComponentName) != null
    ? requireNativeComponent<TsMediapipeProps>(ComponentName)
    : () => {
        throw new Error(LINKING_ERROR);
      };

const createFragment = (viewId: any) =>
  UIManager.dispatchViewManagerCommand(
    viewId,
    (
      UIManager.getViewManagerConfig('TsMediapipeViewManager') as
        | { Commands?: { create?: number } }
        | undefined
    )?.Commands?.create ?? 1,
    [viewId]
  );

const TsMediapipeView: React.FC<MediapipeComponentProps> = (props) => {
  const {
    onLandmark,
    height = deviceHeight,
    width = deviceWidth,
    face = true,
    rightArm = true,
    leftArm = true,
    leftWrist = true,
    rightWrist = true,
    torso = true,
    leftLeg = true,
    rightLeg = true,
    leftAnkle = true,
    rightAnkle = true,
    frameLimit = 20, // ios only(set the frame rate during initialization)
  } = props;
  const ref = useRef(null);

  useEffect(() => {
    const viewId = findNodeHandle(ref.current);
    if (isAndroid) {
      createFragment(viewId);
    }
  }, []);

  const bodyLandmark = (e: any) => {
    if (!isAndroid && onLandmark) {
      onLandmark(e.nativeEvent);
    }
  };

  useEffect(() => {
    let subscription: EmitterSubscription;
    if (isAndroid) {
      const mediaPipeEventEmitter = new NativeEventEmitter(
        MediaPipeNativeModule
      );
      subscription = mediaPipeEventEmitter.addListener(
        'onLandmark',
        (e: any) => {
          onLandmark?.(e);
        }
      );
    }

    return () => {
      subscription?.remove();
    };
  }, [onLandmark]);

  return (
    <View
      style={[props?.style, styles.container, { height: height, width: width }]}
    >
      <TsMediapipe
        height={
          isAndroid ? PixelRatio.getPixelSizeForLayoutSize(height) : height
        }
        width={isAndroid ? PixelRatio.getPixelSizeForLayoutSize(width) : width}
        onLandmark={bodyLandmark}
        face={face}
        leftArm={leftArm}
        rightArm={rightArm}
        leftWrist={leftWrist}
        rightWrist={rightWrist}
        torso={torso}
        leftLeg={leftLeg}
        rightLeg={rightLeg}
        leftAnkle={leftAnkle}
        rightAnkle={rightAnkle}
        ref={ref}
        frameLimit={frameLimit} // ios only(set the frame rate during initialization)
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 0,
  },
});

export { TsMediapipeView as RNMediapipe, switchCamera };
