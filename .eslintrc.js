// 配置项详情请查看官网 https://cn.eslint.org/docs/user-guide/configuring

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    rules: {
        'indent': [
            'error',
            4
        ]
    }
};
