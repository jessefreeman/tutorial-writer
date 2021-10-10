const specialPatterns = 
{
    CamelCaseNames: /([a-zA-Za-z0-9]*\(\).|\w[a-z]+[A-Z0-9][a-z0-9]+[A-Za-z0-9]*)/gm,
    SplitNameExtension: /(^.*?)\.(\w+)$/,
    WhiteSpace: /\S/,
}

exports.specialPatterns = specialPatterns;