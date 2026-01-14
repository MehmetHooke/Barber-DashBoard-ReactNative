import { Button } from "@/components/ui/button";
import { logout } from '@/src/services/auth.service';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Text, View } from 'react-native';

export default function settings() {

    async function cikisYap() {
        try {
            await logout();
            router.replace("/(auth)/login");
        } catch (err) {
            Alert.alert("Çıkış yaparken Hata !");
        }
    }

    return (
        <View className='flex justify-center justify-items-center w-full h-full'>
            <Text className='text-center text-2xl'>profil</Text>
            <Text className='text-center text-2xl'>çıkış yap</Text>
            <Text className='text-center text-2xl'>destek</Text>
            <View className="flex w-full h-20 items-center justify-center bg-blue-200">

                <Button
                    variant='solid'
                    className='mt-3 w-[150px] rounded-xl'
                    onPress={cikisYap}
                >
                    <Text>
                        Çıkış yap
                    </Text>
                </Button>
            </View>
        </View>
    )
}
