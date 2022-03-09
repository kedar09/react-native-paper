import * as React from 'react';
import { View, ViewStyle, Platform, StyleSheet, StyleProp } from 'react-native';
import color from 'color';

import AppbarContent from './AppbarContent';
import AppbarAction from './AppbarAction';
import AppbarBackAction from './AppbarBackAction';
import Surface from '../Surface';
import { withTheme } from '../../core/theming';
import type { Theme } from '../../types';
import {
  getAppbarColor,
  renderAppbarContent,
  DEFAULT_APPBAR_HEIGHT,
  modeAppbarHeight,
  AppbarModes,
} from './utils';

type Props = Partial<React.ComponentPropsWithRef<typeof View>> & {
  /**
   * Whether the background color is a dark color. A dark appbar will render light text and vice-versa.
   */
  dark?: boolean;
  /**
   * Content of the `Appbar`.
   */
  children: React.ReactNode;
  /**
   * @supported Available in v3.x with theme version 3
   *
   * Mode of the Appbar.
   * - `small` - Appbar with default height (56).
   * - `medium` - Appbar with medium height (112).
   * - `large` - Appbar with large height (152).
   * - `center-aligned` - Appbar with default height and center-aligned title.
   */
  mode?: 'small' | 'medium' | 'large' | 'center-aligned';
  /**
   * @optional
   */
  theme: Theme;
  style?: StyleProp<ViewStyle>;
};

/**
 * A component to display action items in a bar. It can be placed at the top or bottom.
 * The top bar usually contains the screen title, controls such as navigation buttons, menu button etc.
 * The bottom bar usually provides access to a drawer and up to four actions.
 *
 * By default Appbar uses primary color as a background, in dark theme with `adaptive` mode it will use surface colour instead.
 * See [Dark Theme](https://callstack.github.io/react-native-paper/theming.html#dark-theme) for more informations
 *
 * ## Usage
 * ```js
 * import * as React from 'react';
 * import { Appbar } from 'react-native-paper';
 * import { StyleSheet } from 'react-native';
 *
 * const MyComponent = () => (
 *  <Appbar style={styles.bottom}>
 *    <Appbar.Action
 *      icon="archive"
 *      onPress={() => console.log('Pressed archive')}
 *     />
 *     <Appbar.Action icon="mail" onPress={() => console.log('Pressed mail')} />
 *     <Appbar.Action icon="label" onPress={() => console.log('Pressed label')} />
 *     <Appbar.Action
 *       icon="delete"
 *       onPress={() => console.log('Pressed delete')}
 *     />
 *   </Appbar>
 *  );
 *
 * export default MyComponent
 *
 * const styles = StyleSheet.create({
 *   bottom: {
 *     position: 'absolute',
 *     left: 0,
 *     right: 0,
 *     bottom: 0,
 *   },
 * });
 * ```
 */
const Appbar = ({
  children,
  dark,
  style,
  theme,
  mode = 'small',
  ...rest
}: Props) => {
  const { isV3 } = theme;
  const {
    backgroundColor: customBackground,
    elevation = isV3 ? 0 : 4,
    ...restStyle
  }: ViewStyle = StyleSheet.flatten(style) || {};

  let isDark: boolean;

  const backgroundColor = getAppbarColor(theme, elevation, customBackground);

  if (typeof dark === 'boolean') {
    isDark = dark;
  } else {
    isDark =
      backgroundColor === 'transparent'
        ? false
        : typeof backgroundColor === 'string'
        ? !color(backgroundColor).isLight()
        : true;
  }

  let shouldCenterContent = false;
  let shouldAddLeftSpacing = false;
  let shouldAddRightSpacing = false;
  if (Platform.OS === 'ios') {
    let hasAppbarContent = false;
    let leftItemsCount = 0;
    let rightItemsCount = 0;

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === AppbarContent) {
          hasAppbarContent = true;
        } else if (hasAppbarContent) {
          rightItemsCount++;
        } else {
          leftItemsCount++;
        }
      }
    });

    shouldCenterContent =
      !isV3 && hasAppbarContent && leftItemsCount < 2 && rightItemsCount < 2;
    shouldAddLeftSpacing = !isV3 && shouldCenterContent && leftItemsCount === 0;
    shouldAddRightSpacing =
      !isV3 && shouldCenterContent && rightItemsCount === 0;
  }

  const isMode = (modeToCompare: AppbarModes) => {
    return isV3 && mode === modeToCompare;
  };

  const filterAppbarActions = React.useCallback(
    (isLeading = false) =>
      React.Children.toArray(children).filter((child) =>
        // @ts-expect-error: TypeScript complains about the type of type but it doesn't matter
        isLeading ? child.props.isLeading : !child.props.isLeading
      ),
    [children]
  );

  return (
    <Surface
      style={[
        { backgroundColor },
        styles.appbar,
        {
          height: isV3 ? modeAppbarHeight[mode] : DEFAULT_APPBAR_HEIGHT,
          elevation,
        },
        restStyle,
      ]}
      {...rest}
    >
      {shouldAddLeftSpacing ? <View style={styles.spacing} /> : null}
      {(!isV3 || isMode('small')) &&
        renderAppbarContent({
          children,
          isDark,
          isV3,
          shouldCenterContent,
        })}
      {(isMode('medium') || isMode('large') || isMode('center-aligned')) && (
        <View
          style={[
            styles.columnContainer,
            isMode('center-aligned') && styles.centerAlignedContainer,
          ]}
        >
          {/* Appbar top row with controls */}
          <View style={styles.controlsRow}>
            {/* Left side of row container, can contain AppbarBackAction or AppbarAction if it's leading icon  */}
            {renderAppbarContent({
              children,
              isDark,
              isV3,
              renderOnly: [AppbarBackAction],
              mode,
            })}
            {renderAppbarContent({
              children: filterAppbarActions(true),
              isDark,
              isV3,
              renderOnly: [AppbarAction],
              mode,
            })}
            {/* Right side of row container, can contain other AppbarAction if they are not leading icons */}
            <View style={styles.rightActionControls}>
              {renderAppbarContent({
                children: filterAppbarActions(false),
                isDark,
                isV3,
                renderOnly: [AppbarAction],
                mode,
              })}
            </View>
          </View>
          {/* Middle of the row, can contain only AppbarContent */}
          {renderAppbarContent({
            children,
            isDark,
            isV3,
            shouldCenterContent: isMode('center-aligned'),
            renderOnly: [AppbarContent],
            mode,
          })}
        </View>
      )}
      {shouldAddRightSpacing ? <View style={styles.spacing} /> : null}
    </Surface>
  );
};

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    elevation: 4,
  },
  spacing: {
    width: 48,
  },
  controlsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightActionControls: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  columnContainer: {
    flexDirection: 'column',
    flex: 1,
    paddingTop: 8,
  },
  centerAlignedContainer: {
    paddingTop: 0,
  },
});

export default withTheme(Appbar);

// @component-docs ignore-next-line
const AppbarWithTheme = withTheme(Appbar);
// @component-docs ignore-next-line
export { AppbarWithTheme as Appbar };
