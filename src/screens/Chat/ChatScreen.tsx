// @src/screens/Chat/ChatScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CustomText from '@src/components/CustomText';
import ChatBubble from '@src/components/ChatBubble';
import { CustomKeyboardAvoidingView } from '@src/components/CustomKeyboardAvoidingView';
import { useTheme } from '@src/theme/ThemeProvider';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImagePickerResponse, launchImageLibrary } from 'react-native-image-picker';
import { MenuView } from '@react-native-menu/menu';
import { EllipsisVertical, Image as ImageIcon, Send } from 'lucide-react-native';
import FastImage from 'react-native-fast-image';

type RouteParams = {
  userId: string;
  name: string;
  online?: boolean;
  avatar?: string;
};

type Message = {
  id: string;
  text?: string;
  image?: string;
  me?: boolean;
  time?: string;
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', text: 'Hello!', me: false, time: '09:00' },
    { id: 'm2', text: 'Hey, how are you?', me: true, time: '09:01' },
  ]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // placeholder: subscribe to websocket events for this chat
    // e.g. echo.private(`chat.${route.params.userId}`).listen('MessageSent', ...)
    // and listen for typing indicators
  }, [route.params.userId]);

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick image');
          return;
        }
        if (response.assets?.[0]?.uri) {
          setSelectedImage(response.assets[0].uri);
        }
      }
    );
  };

  const sendMessage = () => {
    if (selectedImage) {
      // Send image message
      const msg: Message = {
        id: String(Date.now()),
        image: selectedImage,
        me: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((s) => [...s, msg]);
      setSelectedImage(null);
      // send to backend via axios/WebSocket here
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } else if (text.trim()) {
      // Send text message
      const msg: Message = {
        id: String(Date.now()),
        text: text.trim(),
        me: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((s) => [...s, msg]);
      setText('');
      // send to backend via axios/WebSocket here
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleTextChange = (t: string) => {
    setText(t);
    setTyping(!!t.length);

    // Debounce typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);

    // emit typing event via websocket here
  };

  const menuActions = [
    { id: 'block', title: 'Block User', attributes: { destructive: true } },
    { id: 'report', title: 'Report User', attributes: { destructive: true } },
    { id: 'clear', title: 'Clear Chat' },
    { id: 'mute', title: 'Mute Notifications' },
  ];

  const handleMenuAction = (actionId: string) => {
    switch (actionId) {
      case 'block':
        Alert.alert('Blocked', `${route.params?.name} has been blocked`);
        break;
      case 'report':
        Alert.alert('Report', `Report submitted for ${route.params?.name}`);
        break;
      case 'clear':
        Alert.alert('Clear Chat', 'Are you sure?', [
          { text: 'Cancel', onPress: () => { } },
          { text: 'Clear', onPress: () => setMessages([]), style: 'destructive' },
        ]);
        break;
      case 'mute':
        Alert.alert('Muted', 'Notifications muted for this chat');
        break;
      default:
        break;
    }
  };

  return (
    <CustomKeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      isModalScreen={false} keyboardVerticalOffset={0}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            backgroundColor: theme.background,
            paddingTop: insets.top,
          },
        ]}>
        <View style={styles.headerContent}>
          <View style={styles.avatarWithInfo}>
            <View style={[styles.headerAvatarWrap, { backgroundColor: theme.card }]}>
              <FastImage
                source={{
                  uri: route.params?.avatar ?? 'https://robohash.org/' + route.params?.userId,
                }}
                style={styles.headerAvatar}
              />
              {/* {route.params?.online && (
                <View
                  style={[
                    styles.headerOnlineDot,
                    { backgroundColor: theme.online },
                  ]}
                />
              )} */}
            </View>
            <View style={{ flex: 1 }}>
              <CustomText weight="bold" style={{ fontSize: 18 }}>
                {route.params?.name ?? 'Chat'}
              </CustomText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: route.params?.online ? theme.online : theme.subText,
                    marginRight: 6,
                  }}
                />
                <CustomText
                  style={{
                    color: theme.subText,
                    fontSize: 11,
                  }}>
                  {isRemoteTyping ? 'Typing...' : route.params?.online ? 'Online' : 'Offline'}
                </CustomText>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Button */}
        <MenuView
          actions={menuActions}
          onPressAction={({ nativeEvent }) => handleMenuAction(nativeEvent.event)}
        >
          <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
           <EllipsisVertical  color={theme.text} />
          </TouchableOpacity>
        </MenuView>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12 }}
        scrollEnabled={true}
        inverted={false}
        renderItem={({ item }) =>
          item.image ? (
            <View style={[styles.messageBubbleContainer, { alignSelf: item.me ? 'flex-end' : 'flex-start' }]}>
              <FastImage
                source={{ uri: item.image }}
                style={[styles.messageImage]}
              />
              {item.time && (
                <CustomText
                  style={{
                    fontSize: 10,
                    color: theme.subText,
                    marginTop: 4,
                    alignSelf: item.me ? 'flex-end' : 'flex-start',
                  }}>
                  {item.time}
                </CustomText>
              )}
            </View>
          ) : (
            <ChatBubble text={item.text || ''} me={item.me} time={item.time} />
          )
        }
      />

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={[styles.imagePreview, { backgroundColor: theme.card }]}>
          <FastImage source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            style={styles.removeImageBtn}>
            <CustomText style={{ color: '#fff', fontSize: 18 }}>×</CustomText>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <View
        style={[
          styles.inputRow,
          {
            borderTopColor: theme.border,
            backgroundColor: theme.background,
            paddingBottom: insets.bottom + 10,
          },
        ]}>
        {/* Image Picker Button */}
        <TouchableOpacity
          onPress={handleImagePicker}
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          activeOpacity={0.7}>
          <ImageIcon size={20} color={theme.primary} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          placeholder="Message..."
          placeholderTextColor={theme.subText}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={500}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        />

        {/* Send Button */}
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!text.trim() && !selectedImage}
          style={[
            styles.sendBtn,
            {
              backgroundColor: text.trim() || selectedImage ? theme.primary : theme.border,
            },
          ]}
          activeOpacity={0.7}>
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </CustomKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  avatarWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#fff',
  },
  menuButton: {
    padding: 1,
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubbleContainer: {
    marginVertical: 6,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imagePreview: {
    margin: 10,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
