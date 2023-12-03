# -*- coding: utf-8 -*-
# Values from COMMON will be overridden by values from PROVIDERS[provider_name]
# if set.
# Update this in config.py[.enc] as appropriate
PROVIDERS = {
    # Oauth 1.0a
    'twitter': {
        'consumer_key': 'Whaq2yNPK7bfgBOITn73QoV9z',
        'consumer_secret': 'HBTAU026plEqm0pfryY8SJuFcUM4F7fhskSm7WxH17VxdM0p6x',
        'user_id': '1124296217180233728',
        'user_password': 'BandanaEdgeToothpaste',
        'user_username': 'AuthomaticU',
         # Twitter considers selenium login attempts suspicious and occasionally
         # asks a security challenge question. This will be used as the answer.
        'user_challenge_answer': '07906076873',
    },

    # OAuth 2.0
    'facebook': {
        'consumer_key': '1039572966853060', # aka app ID
        'consumer_secret': '88b26d29aede468f15380666286e1f9b', # aka app Secret
        'user_id': '124720399798160',
        'user_login': "authomatic_fyisawf_testuser@tfbnw.net",
        'user_password': 'RedBeeHandstand',
    },
    'github': {
        'consumer_key': '9bd36fe5298c50d5c6b9',
        'consumer_secret': '5bfcda6a963064f18358cd95528879c86e473b72',
        'user_id': '50241634',
        'user_login': 'authomaticproject@protonmail.com',
        'user_password': 'LostExampleOctopus'
    },
}
