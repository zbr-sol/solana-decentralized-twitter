<script setup>
import { toRefs, computed, ref } from 'vue'
import { useWorkspace } from '@/composables'
import { deleteTweet } from '@/api'
import TweetFormUpdate from './TweetFormUpdate'

const props = defineProps({
    tweet: Object,
})
const emit = defineEmits(['delete']);

const { tweet } = toRefs(props)
const { wallet } = useWorkspace()
const isMyTweet = computed(() => wallet.value && wallet.value.publicKey.toBase58() === tweet.value.author.toBase58())
const authorRoute = computed(() => {
    if (isMyTweet.value) {
        return { name: 'Profile' }
    } else {
        return { name: 'Users', params: { author: tweet.value.author.toBase58() } }
    }
})
const onDelete = async () => {
    await deleteTweet(tweet.value);
    emit('delete', tweet.value)
}
const isEditing = ref(false)
</script>

<template>
    <tweet-form-update v-if="isEditing" :tweet="tweet" @close="isEditing = false"></tweet-form-update>
    <div class="px-8 py-4" v-else>
        <div class="flex justify-between">
            <div class="py-1">
                <h3 class="inline font-semibold" :title="tweet.author">
                    <router-link :to="authorRoute" class="hover:underline">
                        {{ tweet.author_display }}
                    </router-link>
                </h3>
                <span class="text-gray-500"> • </span>
                <time class="text-gray-500 text-sm" :title="tweet.created_at">
                    <router-link :to="{ name: 'Tweet', params: { tweet: tweet.publicKey.toBase58() } }" class="hover:underline">
                        {{ tweet.created_ago }}
                    </router-link>
                </time>
            </div>
            <div class="flex" v-if="isMyTweet">
                <button @click="isEditing = true" class="flex px-2 rounded-full text-gray-500 hover:text-pink-500 hover:bg-gray-100" title="Unlike real Twitter, we let you edit Tweets. Cool, right?">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 m-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button @click="onDelete" class="flex px-2" title="Delete tweet">
                    <svg class="trashcan" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 25 24.8" style="enable-background:new 0 0 25 24.8;" xml:space="preserve">
                        <g class="trashcan-open">
                            <path d="M18.7,24.4H5.9L4.9,7h14.9L18.7,24.4z M7.6,22.6H17l0.8-13.7h-11L7.6,22.6z"></path>
                            <polygon points="13.6,10.3 13.1,21.2 14.9,21.2 15.4,10.3 "></polygon>
                            <polygon points="11.5,21.2 11,10.3 9.2,10.3 9.7,21.2 "></polygon>
                            <path d="M19.1,0.7l-4.7,0.9l-0.8-1.4L8.2,1.3L8,3l-4.7,1l0.2,4.7l17.3-3.5L19.1,0.7z 
                                    
                                    M8.8,1.9l4.4 -1.0 l0.5,0.8
                                    L8.7,2.8z 
                                    
                                    M5.2,6.4l0-1L18,2.8l0.3,0.9L5.2,6.4z"></path>
                        </g>
                        <g class="trashcan-closed">
                            <path d="M6.8,8.8h11L17,22.6
                                    H7.6L6.8,8.8z 
                                    M4.9,7l1,17.4h12.8
                                    l1-17.4
                                    H4.9z"></path>
                            <polygon points="13.6,10.3 13.1,21.2 14.9,21.2 15.4,10.3 "></polygon>
                            <polygon points="11.5,21.2 11,10.3 9.2,10.3 9.7,21.2 "></polygon>
                            <path d="M20.4,4h-4.8l-0.5-1.6
                                    H9.5L9,4
                                    H4.2
                                    L3.5,8.6h17.6
                                    L20.4,4z 
                                    
                                    M9.9,3.2h4.8
                                    L14.9,3.9h-5.2z
                                    
                                    M5.6,6.7l0.2-1 h13l0.2,1
                                    H5.6z"></path>
                        </g>
                    </svg>
                </button>
            </div>
        </div>     
        <p class="whitespace-pre-wrap break-all" v-text="tweet.content"></p>
        <router-link v-if="tweet.topic" :to="{ name: 'Topics', params: { topic: tweet.topic } }" class="inline-block mt-2 text-pink-500 hover:underline">
            #{{ tweet.topic }}
        </router-link>
    </div>
</template>
