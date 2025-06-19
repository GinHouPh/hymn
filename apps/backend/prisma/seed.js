"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌱 Starting database seeding...');
        // Create admin user
        const adminPassword = yield bcryptjs_1.default.hash('admin123', 12);
        const admin = yield prisma.user.upsert({
            where: { email: 'admin@hymnal.app' },
            update: {},
            create: {
                email: 'admin@hymnal.app',
                password: adminPassword,
                firstName: 'Admin',
                lastName: 'User',
                role: client_1.UserRole.ADMIN,
                isEmailVerified: true,
            },
        });
        console.log('✅ Admin user created:', admin.email);
        // Create moderator user
        const moderatorPassword = yield bcryptjs_1.default.hash('moderator123', 12);
        const moderator = yield prisma.user.upsert({
            where: { email: 'moderator@hymnal.app' },
            update: {},
            create: {
                email: 'moderator@hymnal.app',
                password: moderatorPassword,
                firstName: 'Moderator',
                lastName: 'User',
                role: client_1.UserRole.MODERATOR,
                isEmailVerified: true,
            },
        });
        console.log('✅ Moderator user created:', moderator.email);
        // Create regular user
        const userPassword = yield bcryptjs_1.default.hash('user123', 12);
        const user = yield prisma.user.upsert({
            where: { email: 'user@hymnal.app' },
            update: {},
            create: {
                email: 'user@hymnal.app',
                password: userPassword,
                firstName: 'Regular',
                lastName: 'User',
                role: client_1.UserRole.USER,
                isEmailVerified: true,
            },
        });
        console.log('✅ Regular user created:', user.email);
        // Create sample songs
        const songs = [
            {
                title: 'Amazing Grace',
                lyrics: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

Through many dangers, toils, and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.

The Lord has promised good to me,
His Word my hope secures;
He will my Shield and Portion be,
As long as life endures.`,
                composer: 'John Newton',
                category: 'Traditional',
                tags: ['grace', 'salvation', 'traditional'],
                key: 'G',
                timeSignature: '3/4',
                tempo: 'Andante',
                difficulty: 'Easy',
                language: 'English',
                yearWritten: 1772,
                description: 'A beloved hymn about God\'s grace and redemption.',
            },
            {
                title: 'How Great Thou Art',
                lyrics: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made,
I see the stars, I hear the rolling thunder,
Thy power throughout the universe displayed.

Then sings my soul, my Savior God, to Thee:
How great Thou art! How great Thou art!
Then sings my soul, my Savior God, to Thee:
How great Thou art! How great Thou art!

When through the woods and forest glades I wander
And hear the birds sing sweetly in the trees,
When I look down from lofty mountain grandeur
And hear the brook and feel the gentle breeze.

And when I think that God, His Son not sparing,
Sent Him to die, I scarce can take it in,
That on the cross, my burden gladly bearing,
He bled and died to take away my sin.`,
                composer: 'Carl Boberg',
                category: 'Worship',
                tags: ['worship', 'nature', 'praise'],
                key: 'Bb',
                timeSignature: '4/4',
                tempo: 'Moderato',
                difficulty: 'Medium',
                language: 'English',
                yearWritten: 1885,
                description: 'A powerful hymn of praise celebrating God\'s greatness.',
            },
            {
                title: 'Be Thou My Vision',
                lyrics: `Be Thou my vision, O Lord of my heart;
Naught be all else to me, save that Thou art.
Thou my best thought, by day or by night,
Waking or sleeping, Thy presence my light.

Be Thou my wisdom, and Thou my true word;
I ever with Thee and Thou with me, Lord;
Thou my great Father, I Thy true son;
Thou in me dwelling, and I with Thee one.

Riches I heed not, nor man's empty praise,
Thou mine inheritance, now and always:
Thou and Thou only, first in my heart,
High King of Heaven, my treasure Thou art.

High King of Heaven, my victory won,
May I reach Heaven's joys, O bright Heaven's Sun!
Heart of my own heart, whatever befall,
Still be my vision, O Ruler of all.`,
                composer: 'Traditional Irish',
                category: 'Celtic',
                tags: ['vision', 'devotion', 'celtic'],
                key: 'D',
                timeSignature: '3/4',
                tempo: 'Andante',
                difficulty: 'Medium',
                language: 'English',
                yearWritten: 800,
                description: 'An ancient Irish hymn expressing devotion to God.',
            },
            {
                title: 'Holy, Holy, Holy',
                lyrics: `Holy, holy, holy! Lord God Almighty!
Early in the morning our song shall rise to Thee;
Holy, holy, holy, merciful and mighty!
God in three Persons, blessed Trinity!

Holy, holy, holy! All the saints adore Thee,
Casting down their golden crowns around the glassy sea;
Cherubim and seraphim falling down before Thee,
Which wert, and art, and evermore shalt be.

Holy, holy, holy! though the darkness hide Thee,
Though the eye of sinful man Thy glory may not see;
Only Thou art holy; there is none beside Thee,
Perfect in power, in love, and purity.

Holy, holy, holy! Lord God Almighty!
All Thy works shall praise Thy Name, in earth, and sky, and sea;
Holy, holy, holy; merciful and mighty!
God in three Persons, blessed Trinity!`,
                composer: 'Reginald Heber',
                category: 'Trinity',
                tags: ['holy', 'trinity', 'worship'],
                key: 'Eb',
                timeSignature: '4/4',
                tempo: 'Maestoso',
                difficulty: 'Medium',
                language: 'English',
                yearWritten: 1826,
                description: 'A majestic hymn celebrating the holiness of the Trinity.',
            },
            {
                title: 'It Is Well With My Soul',
                lyrics: `When peace, like a river, attendeth my way,
When sorrows like sea billows roll;
Whatever my lot, Thou hast taught me to say,
It is well, it is well with my soul.

It is well with my soul,
It is well, it is well with my soul.

Though Satan should buffet, though trials should come,
Let this blest assurance control,
That Christ hath regarded my helpless estate,
And hath shed His own blood for my soul.

My sin, oh the bliss of this glorious thought!
My sin, not in part but the whole,
Is nailed to the cross, and I bear it no more,
Praise the Lord, praise the Lord, O my soul!

And Lord, haste the day when the faith shall be sight,
The clouds be rolled back as a scroll;
The trump shall resound, and the Lord shall descend,
Even so, it is well with my soul.`,
                composer: 'Horatio Spafford',
                category: 'Comfort',
                tags: ['peace', 'comfort', 'faith'],
                key: 'C',
                timeSignature: '4/4',
                tempo: 'Andante',
                difficulty: 'Easy',
                language: 'English',
                yearWritten: 1873,
                description: 'A hymn of faith and peace written during personal tragedy.',
            },
        ];
        for (const songData of songs) {
            const song = yield prisma.song.upsert({
                where: { title: songData.title },
                update: {},
                create: songData,
            });
            console.log(`✅ Song created: ${song.title}`);
        }
        // Create user preferences for the regular user
        yield prisma.userPreferences.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                theme: 'light',
                fontSize: 16,
                autoPlay: false,
                showChords: true,
                showLyrics: true,
                defaultKey: 'C',
                language: 'English',
            },
        });
        console.log('✅ User preferences created');
        // Add some favorites for the regular user
        const allSongs = yield prisma.song.findMany();
        const favoriteSongs = allSongs.slice(0, 3); // First 3 songs
        for (const song of favoriteSongs) {
            yield prisma.songFavorite.upsert({
                where: {
                    userId_songId: {
                        userId: user.id,
                        songId: song.id,
                    },
                },
                update: {},
                create: {
                    userId: user.id,
                    songId: song.id,
                },
            });
        }
        console.log(`✅ Added ${favoriteSongs.length} favorites for user`);
        // Create a sample playlist
        const playlist = yield prisma.playlist.upsert({
            where: {
                userId_name: {
                    userId: user.id,
                    name: 'My Favorite Hymns',
                },
            },
            update: {},
            create: {
                userId: user.id,
                name: 'My Favorite Hymns',
                description: 'A collection of my most beloved hymns',
                isPublic: false,
            },
        });
        // Add songs to the playlist
        for (let i = 0; i < favoriteSongs.length; i++) {
            yield prisma.playlistSong.upsert({
                where: {
                    playlistId_songId: {
                        playlistId: playlist.id,
                        songId: favoriteSongs[i].id,
                    },
                },
                update: {},
                create: {
                    playlistId: playlist.id,
                    songId: favoriteSongs[i].id,
                    order: i + 1,
                },
            });
        }
        console.log('✅ Sample playlist created with songs');
        // Add some view history
        for (const song of allSongs.slice(0, 4)) {
            yield prisma.viewHistory.create({
                data: {
                    userId: user.id,
                    songId: song.id,
                },
            });
        }
        console.log('✅ View history entries created');
        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('Admin: admin@hymnal.app / admin123');
        console.log('Moderator: moderator@hymnal.app / moderator123');
        console.log('User: user@hymnal.app / user123');
    });
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
