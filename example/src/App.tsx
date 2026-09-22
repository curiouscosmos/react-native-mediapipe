import * as React from 'react';

import {
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Dimensions,
  View,
} from 'react-native';
import {
  RNMediapipe,
  switchCamera,
} from '@curiouscosmos/react-native-mediapipe';

type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

type PosePayload = {
  landmarks?: Landmark[];
};

type ActionName =
  | 'Sitting'
  | 'Jumped'
  | 'Left Arm'
  | 'Right Arm'
  | 'Moved Left'
  | 'Moved Right'
  | 'Standing';

const MIN_CONFIDENCE = 0.65;
const REQUIRED_FRAMES = 2;
const BADGE_VISIBLE_MS = 2000;
const MOVE_THRESHOLD = 0.08;

const SHOULDER_L = 11;
const SHOULDER_R = 12;
const ELBOW_L = 13;
const ELBOW_R = 14;
const WRIST_L = 15;
const WRIST_R = 16;
const HIP_L = 23;
const HIP_R = 24;
const KNEE_L = 25;
const KNEE_R = 26;
const ANKLE_L = 27;
const ANKLE_R = 28;

const visible = (landmark?: Landmark): landmark is Landmark =>
  !!landmark &&
  (landmark.visibility ?? 1) >= MIN_CONFIDENCE &&
  (landmark.presence ?? 1) >= MIN_CONFIDENCE;

const midpoint = (a: Landmark, b: Landmark) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const angle = (a: Landmark, b: Landmark, c: Landmark) => {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  return mag
    ? (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI
    : 180;
};

export default function App() {
  const { width, height } = Dimensions.get('window');
  const [badgeText, setBadgeText] = React.useState<ActionName | null>(null);
  const hideBadgeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const movementHipCenter = React.useRef<{ x: number; y: number } | null>(null);
  const standingHipY = React.useRef<number | null>(null);
  const pendingAction = React.useRef<ActionName | null>(null);
  const pendingFrames = React.useRef(0);
  const visibleBadge = React.useRef<ActionName | null>(null);
  const isFrontCamera = React.useRef(true);

  React.useEffect(
    () => () => {
      if (hideBadgeTimer.current) {
        clearTimeout(hideBadgeTimer.current);
      }
    },
    []
  );

  const onFlip = () => {
    isFrontCamera.current = !isFrontCamera.current;
    movementHipCenter.current = null;
    switchCamera();
  };

  const displayAction = React.useCallback((action: ActionName) => {
    if (!isFrontCamera.current) {
      return action;
    }

    console.log('Action->', action);
    if (action === 'Left Arm') {
      return 'Right Arm';
    }
    if (action === 'Right Arm') {
      return 'Left Arm';
    }
    if (action === 'Moved Left') {
      return 'Moved Right';
    }
    if (action === 'Moved Right') {
      return 'Moved Left';
    }

    return action;
  }, []);

  const showBadge = React.useCallback((action: ActionName) => {
    if (visibleBadge.current === action) {
      return;
    }

    visibleBadge.current = action;
    setBadgeText(action);

    if (hideBadgeTimer.current) {
      clearTimeout(hideBadgeTimer.current);
    }

    hideBadgeTimer.current = setTimeout(() => {
      visibleBadge.current = null;
      setBadgeText(null);
    }, BADGE_VISIBLE_MS);
  }, []);

  const detectAction = React.useCallback(
    (landmarks: Landmark[]) => {
      const leftShoulder = landmarks[SHOULDER_L];
      const rightShoulder = landmarks[SHOULDER_R];
      const leftElbow = landmarks[ELBOW_L];
      const rightElbow = landmarks[ELBOW_R];
      const leftWrist = landmarks[WRIST_L];
      const rightWrist = landmarks[WRIST_R];
      const leftHip = landmarks[HIP_L];
      const rightHip = landmarks[HIP_R];
      const leftKnee = landmarks[KNEE_L];
      const rightKnee = landmarks[KNEE_R];
      const leftAnkle = landmarks[ANKLE_L];
      const rightAnkle = landmarks[ANKLE_R];

      if (
        visible(leftShoulder) &&
        visible(leftElbow) &&
        visible(leftWrist) &&
        leftWrist.y < leftShoulder.y - 0.05 &&
        leftElbow.y < leftShoulder.y
      ) {
        return displayAction('Left Arm');
      }

      if (
        visible(rightShoulder) &&
        visible(rightElbow) &&
        visible(rightWrist) &&
        rightWrist.y < rightShoulder.y - 0.05 &&
        rightElbow.y < rightShoulder.y
      ) {
        return displayAction('Right Arm');
      }

      if (
        visible(leftHip) &&
        visible(rightHip) &&
        visible(leftKnee) &&
        visible(rightKnee) &&
        visible(leftAnkle) &&
        visible(rightAnkle)
      ) {
        const hipCenter = midpoint(leftHip, rightHip);
        const movementBase = movementHipCenter.current;
        movementHipCenter.current = movementBase ?? hipCenter;

        const sitting =
          angle(leftHip, leftKnee, leftAnkle) < 130 &&
          angle(rightHip, rightKnee, rightAnkle) < 130 &&
          leftHip.y < leftKnee.y &&
          rightHip.y < rightKnee.y;

        if (!sitting) {
          standingHipY.current =
            standingHipY.current == null
              ? hipCenter.y
              : standingHipY.current * 0.9 + hipCenter.y * 0.1;
        }

        if (sitting) {
          console.log('Action->', 'Sitting');
          return 'Sitting';
        }

        if (
          standingHipY.current != null &&
          standingHipY.current - hipCenter.y > 0.08
        ) {
          console.log('Action->', 'Jumped');
          return 'Jumped';
        }

        if (movementBase) {
          const deltaX = hipCenter.x - movementBase.x;
          if (deltaX > MOVE_THRESHOLD) {
            movementHipCenter.current = hipCenter;
            return displayAction('Moved Right');
          }
          if (deltaX < -MOVE_THRESHOLD) {
            movementHipCenter.current = hipCenter;
            return displayAction('Moved Left');
          }
        }

        if (
          angle(leftHip, leftKnee, leftAnkle) > 150 &&
          angle(rightHip, rightKnee, rightAnkle) > 150 &&
          leftHip.y < leftKnee.y &&
          rightHip.y < rightKnee.y
        ) {
          console.log('Action->', 'Standing');
          return 'Standing';
        }
      }

      return null;
    },
    [displayAction]
  );

  const handleLandmark = (data: any) => {
    let payload: PosePayload;
    try {
      payload = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      return;
    }

    const landmarks = payload?.landmarks;
    const action =
      landmarks && landmarks.length > ANKLE_R ? detectAction(landmarks) : null;

    console.log('Action->', action, 'Pending.current->', pendingAction.current);
    if (action === pendingAction.current) {
      pendingFrames.current += 1;
    } else {
      pendingAction.current = action;
      pendingFrames.current = action ? 1 : 0;
    }

    console.log(
      'Action->',
      action,
      'Pending.current',
      pendingFrames.current,
      'Required Frames ->',
      REQUIRED_FRAMES
    );
    if (action && pendingFrames.current >= REQUIRED_FRAMES) {
      showBadge(action);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNMediapipe
        style={styles.tsMediapipeView}
        width={width}
        height={height}
        onLandmark={handleLandmark}
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
        frameLimit={25} // ios only(set the frame rate during initialization)
      />
      <TouchableOpacity onPress={onFlip} style={styles.btnView}>
        <Text style={styles.btnTxt}>Switch Camera</Text>
      </TouchableOpacity>
      {badgeText ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  btnView: {
    width: 150,
    height: 60,
    backgroundColor: 'green',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 42,
  },
  btnTxt: { color: 'white' },
  badge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 10,
    elevation: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tsMediapipeView: {
    alignSelf: 'center',
  },
});
