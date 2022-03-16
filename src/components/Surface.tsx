import * as React from 'react';
import {
  Animated,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import shadow from '../styles/shadow';
import { useTheme } from '../core/theming';
import overlay, { isAnimatedValue } from '../styles/overlay';
import type { MD3Elevation, Theme } from '../types';

type MD2Props = React.ComponentPropsWithRef<typeof View> & {
  /**
   * Content of the `Surface`.
   */
  children: React.ReactNode;
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /**
   * @optional
   */
  theme?: Theme;
};

type Props = MD2Props & {
  elevation?: MD3Elevation | Animated.Value;
};

/**
 * Surface is a basic container that can give depth to an element with elevation shadow.
 * On dark theme with `adaptive` mode, surface is constructed by also placing a semi-transparent white overlay over a component surface.
 * See [Dark Theme](https://callstack.github.io/react-native-paper/theming.html#dark-theme) for more information.
 * Overlay and shadow can be applied by specifying the `elevation` property both on Android and iOS.
 *
 * <div class="screenshots">
 *   <img src="screenshots/surface-1.png" />
 *   <img src="screenshots/surface-2.png" />
 *   <img src="screenshots/surface-3.png" />
 * </div>
 *
 * <div class="screenshots">
 *   <img src="screenshots/surface-dark-1.png" />
 *   <img src="screenshots/surface-dark-2.png" />
 * </div>
 *
 * ## Usage
 * ```js
 * import * as React from 'react';
 * import { Surface, Text } from 'react-native-paper';
 * import { StyleSheet } from 'react-native';
 *
 * const MyComponent = () => (
 *   <Surface style={styles.surface}>
 *      <Text>Surface</Text>
 *   </Surface>
 * );
 *
 * export default MyComponent;
 *
 * const styles = StyleSheet.create({
 *   surface: {
 *     padding: 8,
 *     height: 80,
 *     width: 80,
 *     alignItems: 'center',
 *     justifyContent: 'center',
 *     elevation: 4,
 *   },
 * });
 * ```
 */

const MD2Surface = ({ style, theme: overrideTheme, ...rest }: MD2Props) => {
  const { elevation = 4 } = (StyleSheet.flatten(style) || {}) as ViewStyle;
  const { dark: isDarkTheme, mode, colors } = useTheme(overrideTheme);

  return (
    <Animated.View
      {...rest}
      style={[
        {
          backgroundColor:
            isDarkTheme && mode === 'adaptive'
              ? overlay(elevation, colors?.surface)
              : colors?.surface,
        },
        elevation ? shadow(elevation) : null,
        style,
      ]}
    />
  );
};

const Surface = ({
  elevation = 1,
  children,
  theme: overridenTheme,
  style,
  ...props
}: Props) => {
  const theme = useTheme(overridenTheme);

  if (!theme.isV3)
    return (
      <MD2Surface {...props} theme={theme} style={style}>
        {children}
      </MD2Surface>
    );

  const { colors } = theme;

  const inputRange = [0, 1, 2, 3, 4, 5];

  const backgroundColor = (() => {
    if (isAnimatedValue(elevation)) {
      return elevation.interpolate({
        inputRange,
        outputRange: inputRange.map((elevation) => {
          return colors.elevation?.[`level${elevation as MD3Elevation}`];
        }),
      });
    }

    return colors.elevation?.[`level${elevation}`];
  })();

  const sharedStyle = [{ backgroundColor }, style];

  if (Platform.OS === 'android') {
    const elevationLevels = [
      [0, 1, 2, 3, 3, 3],
      [0, 3, 4, 6, 8, 10],
    ];

    const getElevationAndroid = (layer: 0 | 1) => {
      const elevationLevel = elevationLevels[layer];

      if (isAnimatedValue(elevation)) {
        return elevation.interpolate({
          inputRange,
          outputRange: elevationLevel,
        });
      }

      return elevationLevel[elevation];
    };

    const { margin, padding, transform, borderRadius } = StyleSheet.flatten(
      style
    ) as ViewStyle;

    const clearSpacing = {
      margin: 0,
      padding: 0,
    };

    const outerLayerStyles = { margin, padding, transform, borderRadius };

    return (
      <Animated.View
        style={[
          {
            elevation: getElevationAndroid(0),
            backgroundColor,
          },
          outerLayerStyles,
        ]}
      >
        <Animated.View
          style={[
            { elevation: getElevationAndroid(1), borderRadius },
            sharedStyle,
            clearSpacing,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    );
  }

  const iOSShadowOutputRanges = [
    {
      shadowOpacity: 0.15,
      height: [0, 1, 2, 4, 6, 8],
      shadowRadius: [0, 3, 6, 8, 10, 12],
    },
    {
      shadowOpacity: 0.3,
      height: [0, 1, 1, 1, 2, 4],
      shadowRadius: [0, 1, 2, 3, 3, 4],
    },
  ];

  const shadowColor = '#000';

  if (isAnimatedValue(elevation)) {
    const inputRange = [0, 1, 2, 3, 4, 5];

    const getStyleForAnimatedShadowLayer = (layer: 0 | 1) => {
      return {
        shadowColor,
        shadowOpacity: iOSShadowOutputRanges[layer].shadowOpacity,
        shadowOffset: {
          width: 0,
          height: elevation.interpolate({
            inputRange,
            outputRange: iOSShadowOutputRanges[layer].height,
          }),
        },
        shadowRadius: elevation.interpolate({
          inputRange,
          outputRange: iOSShadowOutputRanges[layer].shadowRadius,
        }),
      };
    };

    return (
      <Animated.View style={getStyleForAnimatedShadowLayer(0)}>
        <Animated.View style={getStyleForAnimatedShadowLayer(1)}>
          <Animated.View {...props} style={sharedStyle}>
            {children}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    );
  }

  const getStyleForShadowLayer = (layer: 0 | 1) => {
    return {
      shadowColor,
      shadowOpacity: iOSShadowOutputRanges[layer].shadowOpacity,
      shadowOffset: {
        width: 0,
        height: iOSShadowOutputRanges[layer].height[elevation],
      },
      shadowRadius: iOSShadowOutputRanges[layer].shadowRadius[elevation],
    };
  };

  return (
    <Animated.View style={getStyleForShadowLayer(0)}>
      <Animated.View style={getStyleForShadowLayer(1)}>
        <Animated.View {...props} style={sharedStyle}>
          {children}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

export default Surface;
