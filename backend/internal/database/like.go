package database

import "strings"

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

func LikePattern(search string) string {
	return "%" + likeEscaper.Replace(search) + "%"
}
