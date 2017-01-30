package main

import "bytes"

func markdown(m *CombinedResultMap) (string, error) {
	var buffer bytes.Buffer

	for h1, v1 := range *m {
		if len(v1) == 0 || h1 == "summary" {
			continue
		}
		heading(h1, 2, &buffer)
		for h2, v2 := range v1 {
			if len(v2) == 0 {
				continue
			}
			heading(h2, 3, &buffer)
			table(v2, &buffer)
		}
	}
	return buffer.String(), nil
}

func heading(s string, level int, b *bytes.Buffer) {
	if level < 3 {
		b.WriteString(s + "\n")
		for i := 0; i < len(s); i++ {
			underline := "="
			if level > 1 {
				underline = "-"
			}
			b.WriteString(underline)
		}
	} else {
		for i := 0; i < level; i++ {
			b.WriteString("#")
		}
		b.WriteString(" " + s)
	}
	b.WriteString("\n\n")
}

func table(s ContainerSet, b *bytes.Buffer) {
	//alloc string table
	count := len(s)
	rows := make([][]string, count+1) //set length plus header row

	//header row
	rows[0] = []string{"Namespace", "Name", "Container"}

	//content rows
	for i := 0; i < count; i++ {
		spec := s[i]
		rows[i+1] = []string{spec.Namespace, spec.Name, spec.Container}
	}

	b.WriteString(markdownTable(&rows))
}
