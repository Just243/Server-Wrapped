export const STATS_CONFIG = [{
    type: 'title',
    title: 'Project 1024^2',
    subtitle: 'Wrapped 2025',
    text: 'Your diggy diggy experience'
},

{
    type: 'text',
    title: 'This was long ngl...',
    subtitle: 'I wanted to finish this in a week lmfao'
},

{
    type: 'community-single',
    stat: 'minecraft:custom.minecraft:play_time',
    title: 'Total Human Playtime',
    subtitle: 'damm...',
    filterType: 'players',
    format: 'time'
},

{
    type: 'leaderboard',
    stat: 'minecraft:custom.minecraft:play_time',
    title: 'Most Playtime',
    subtitle: 'peak unemployment',
    filterType: 'players',
    format: 'time'
},

{
    type: 'leaderboard',
    stat: 'minecraft:custom.minecraft:play_time',
    title: 'Most Playtime',
    subtitle: '(Bots)',
    filterType: 'bots',
    format: 'time'
},

{
    type: 'text',
    title: 'OSHA?',
    subtitle: 'never heard of her'
},

{
    type: 'community-single',
    stat: 'minecraft:custom.minecraft:deaths',
    title: 'Total Deaths',
    filterType: 'all',
    format: 'number'
},

{
    type: 'text',
    title: 'Vegans?',
    subtitle: 'uhh...'
},

{
    type: 'leaderboard',
    stat: 'minecraft:killed',
    title: 'Kills',
    filterType: 'all',
    format: 'number',
    aggregate: true
},

{
    type: 'text',
    title: 'Travelling the world...',
},

{
    type: 'leaderboard',
    stat: 'minecraft:custom.minecraft:sprint_one_cm',
    title: 'Most run',
    subtitle: 'distance sprinted',
    filterType: 'players',
    format: 'distance'
},

{
    type: 'leaderboard',
    stat: 'minecraft:custom.minecraft:aviate_one_cm',
    title: 'Most fly',
    subtitle: 'distance flown with elytra',
    filterType: 'players',
    format: 'distance'
},

{
    type: 'leaderboard',
    stat: 'minecraft:custom.minecraft:boat_one_cm',
    title: 'Most boat',
    subtitle: 'distance traveled by boat',
    filterType: 'players',
    format: 'distance'
},

{
    type: 'leaderboard',
    stat: 'minecraft:custom.minecraft:happy_ghast_one_cm',
    title: 'Most happy',
    subtitle: 'distance traveled by happy ghast',
    filterType: 'players',
    format: 'distance'
},

{
    type: 'text',
    title: 'Working as a team',
    subtitle: 'luv u all :3'
},

{
    type: 'community-multi',
    stats: [{
            stat: 'minecraft:custom.minecraft:damage_dealt',
            title: 'Damage dealt',
            filterType: 'all'
        },
        {
            stat: 'minecraft:mined',
            title: 'Blocks mined',
            filterType: 'all',
            aggregate: true
        },
        {
            stat: 'minecraft:picked_up',
            title: 'Items picked up',
            filterType: 'all',
            aggregate: true
        },
        {
            stat: 'minecraft:crafted',
            title: 'Items crafted',
            filterType: 'players',
            aggregate: true
        },
    ],
    title: 'Community stats',
    subtitle: 'including bots'
},

{
    type: 'text',
    title: 'Natural Resources?',
    subtitle: 'Yall carried this'
},

{
    type: 'leaderboard',
    stat: 'minecraft:mined.minecraft:spruce_log',
    title: 'Mined Spruce Log',
    filterType: 'players',
    format: 'number'
},

{
    type: 'leaderboard',
    stat: 'minecraft:mined.minecraft:ancient_debris',
    title: 'Mined Ancient Debris',
    filterType: 'players',
    format: 'number'
},

{
    type: 'leaderboard',
    stat: 'minecraft:custom.minecraft:talked_to_villager',
    title: 'Talked to Villager',
    subtitle: 'slavery smh',
    filterType: 'players',
    format: 'number'
},

{
    type: 'text',
    title: 'Ready for some quizzes?',
},

{
    type: 'quiz',
    stat: 'minecraft:mined.minecraft:nether_quartz_ore',
    title: 'Who gathered the most quartz?',
    subtitle: '(quartz ore mined)',
    filterType: 'players'
},

{
    type: 'quiz',
    stat: 'minecraft:mined',
    title: 'Most diggy diggy?',
    subtitle: '(blocks mined)',
    filterType: 'players',
    aggregate: true
},

{
    type: 'quiz',
    stat: 'minecraft:custom.minecraft:interact_with_brewingstand',
    title: 'Local brewery',
    subtitle: '(Most interactions with brewing stand)',
    filterType: 'players',
    aggregate: true
},

{
    type: 'quiz',
    stat: 'minecraft:custom.minecraft:raid_trigger',
    title: 'Raids triggered?',
    subtitle: 'what a hard question',
    filterType: 'all'
},

{
    type: 'text',
    title: 'Ngl, this was amazing',
    subtitle: 'Wouldn\'t have been possible without yall, tysm :3'
},

{
    type: 'text',
    title: 'Ready for Project 2560^2?',
    subtitle: '/j'
},

{
    type: 'search',
    title: 'Explore the Stats',
    subtitle: 'Search players or statistics'
}
];