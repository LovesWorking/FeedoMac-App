import React, { useEffect, useState } from "react";
import {
    View,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TextInput,
} from "react-native";

import CustomText from "@src/components/CustomText";
import { CustomSafeAreaView } from "@src/components/CustomSafeAreaView";
import { useTheme } from "@src/theme/ThemeProvider";
import { navigate, goBack } from "@src/navigation/navigationRef";
import { SCREENS } from "@src/constants/screens";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import httpApi from "@src/api/http";
import { useUserStore } from "@src/store/userStore";

import { ArrowLeft, Moon, Sun, Search } from "lucide-react-native";

export default function AllUsersScreen() {
    const { theme, mode, setMode } = useTheme();
    const inset = useSafeAreaInsets();

    const user = useUserStore((s: any) => s.user);

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // -------------------------------
    // Load Users
    // -------------------------------
    const loadUsers = async () => {
        try {
            const res = await httpApi.get("/users");

            console.log("resres", res)
            // Remove logged-in user from the list
            const list = res.data.filter((u: any) => u.id !== user?.id);

            setUsers(list);
            setFiltered(list);
        } catch (error) {
            console.log("Users load error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    // -------------------------------
    // Search filter
    // -------------------------------
    useEffect(() => {
        if (!search.trim()) {
            setFiltered(users);
            return;
        }

        setFiltered(
            users.filter((u: any) =>
                u.name.toLowerCase().includes(search.toLowerCase())
            )
        );
    }, [search]);

    // -------------------------------
    // Render each user row
    // -------------------------------
    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.row}
            onPress={() =>
                navigate(SCREENS.Chat, {
                    userId: item.id,
                    name: item.name,
                    avatar: item.avatar,
                    online: item.online,
                })
            }
        >
            <View style={styles.avatarContainer}>
                <View style={[styles.avatarWrap, { backgroundColor: theme.card }]}>
                    <Image
                        source={{ uri: item.avatar ?? `https://robohash.org/${item.id}` }}
                        style={styles.avatar}
                    />
                </View>

                {item.online == 1 && (
                    <View style={[styles.onlineDot, { backgroundColor: theme.online }]} />
                )}
            </View>

            <View style={styles.meta}>
                <CustomText weight="medium" style={{ fontSize: 16 }}>
                    {item.name}
                </CustomText>

                <CustomText style={{ color: theme.subText, marginTop: 4 }}>
                    {item.email}
                </CustomText>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <CustomSafeAreaView
                style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            >
                <ActivityIndicator size="large" color={theme.text} />
            </CustomSafeAreaView>
        );
    }

    return (
        <CustomSafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Header */}
            <View
                style={[
                    styles.header,
                    { borderBottomColor: theme.border, paddingTop: inset.top },
                ]}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TouchableOpacity onPress={goBack}>
                        <ArrowLeft size={22} color={theme.text} />
                    </TouchableOpacity>

                    <View>
                        <CustomText weight="bold" style={{ fontSize: 22 }}>
                            All Users
                        </CustomText>

                        {/* Small logged-in user text */}
                        <CustomText style={{ fontSize: 13, color: theme.subText }}>
                            Logged in as {user?.name}
                        </CustomText>
                    </View>
                </View>

                {/* Theme toggle */}
                <TouchableOpacity
                    style={[styles.themeToggle, { backgroundColor: theme.card }]}
                    onPress={() => setMode(mode === "light" ? "dark" : "light")}
                >
                    {mode === "light" ? (
                        <Moon size={20} color={theme.text} />
                    ) : (
                        <Sun size={20} color={theme.text} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View
                style={[
                    styles.searchBox,
                    { backgroundColor: theme.card, borderColor: theme.border },
                ]}
            >
                <Search size={18} color={theme.subText} />
                <TextInput
                    placeholder="Search users..."
                    placeholderTextColor={theme.subText}
                    style={[styles.searchInput, { color: theme.text }]}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Users list */}
            <FlatList
                data={filtered}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 4 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </CustomSafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingBottom: 16,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    themeToggle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 14,
        marginTop: 12,
        marginBottom: 4,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 44,
    },

    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 6,
    },

    avatarContainer: {
        width: 52,
        height: 52,
        marginRight: 12,
        position: "relative",
    },

    avatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: "hidden",
    },

    avatar: { width: "100%", height: "100%" },

    onlineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: "absolute",
        right: 0,
        bottom: 0,
        borderWidth: 2,
        borderColor: "#fff",
    },

    meta: { flex: 1 },
});
