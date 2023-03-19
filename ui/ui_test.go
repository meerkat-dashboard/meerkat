package ui

import (
	"os/exec"
	"testing"
)

func TestUI(t *testing.T) {
	cmd := exec.Command("node", "--test")
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Errorf("run node tests: %v", err)
	}
	t.Log(string(output))
}
