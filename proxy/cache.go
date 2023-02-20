package proxy

import (
	"sync"
	"time"
)

// A Cache holds an in-memory key-value store.
// Each entry consists of a server response body and an expiry time.
// A stale entry is one whose expiry time is in the past.
// At a configurable interval, the cache is scanned for stale entries to evict.
// It is safe for concurrent use.
//
// To create a Cache, use NewCache.
type Cache struct {
	entries map[string]entry
	mu      *sync.RWMutex
	ticker  *time.Ticker
	close   chan bool
}

type entry struct {
	value  []byte
	expiry time.Time
}

// NewCache returns an initialised Cache which evicts entries at scanStale intervals.
func NewCache(scanStale time.Duration) *Cache {
	cache := &Cache{
		entries: make(map[string]entry),
		mu:      &sync.RWMutex{},
		ticker:  time.NewTicker(scanStale),
	}
	go cache.loop()
	return cache
}

func (c *Cache) loop() {
	for {
		select {
		case <-c.ticker.C:
			c.evictStale()
		case <-c.close:
			c.ticker.Stop()
			break
		}
	}
}

func (c *Cache) evictStale() {
	c.mu.Lock()
	for k, v := range c.entries {
		if time.Since(v.expiry) > 0 {
			delete(c.entries, k)
		}
	}
	c.mu.Unlock()
}

func (c *Cache) Close() {
	c.close <- true
}

// Load performs a lookup for the named entry.
// If no entry is found, ok is false.
func (c *Cache) Load(name string) (p []byte, ok bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	ent, ok := c.entries[name]
	if !ok {
		return nil, false
	}
	return ent.value, true
}

// Store inserts a new entry with the key name and value body into the cache.
// The entry is considered stale after the time-to-live (TTL) duration is passed.
// Stale entries will be returned by Load if the given TTL is less than the cache's scan interval.
func (c *Cache) Store(name string, body []byte, ttl time.Duration) {
	c.mu.Lock()
	c.entries[name] = entry{body, time.Now().Add(ttl)}
	c.mu.Unlock()
}
