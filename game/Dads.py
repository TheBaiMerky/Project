import pygame
import random

pygame.init()

WIDTH, HEIGHT = 480, 640
WHITE = (255, 255, 255)
RED = (220, 60, 60)
BLUE = (60, 120, 220)
GOLD = (230, 190, 50)
BLACK = (0, 0, 0)

screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Dodge")
clock = pygame.time.Clock()
font = pygame.font.SysFont(None, 36)
big_font = pygame.font.SysFont(None, 64)


raw_enemy_image = pygame.image.load("game/assets/enemy.jpg").convert_alpha()
raw_bonus_image = pygame.image.load("game/assets/bonus.jpg").convert_alpha()

class Player:
    def __init__(self):
        self.rect = pygame.Rect(WIDTH // 2 - 20, HEIGHT - 60, 40, 40)
        self.speed = 6

        raw_image = pygame.image.load("game/assets/player.png").convert_alpha()
        self.image = pygame.transform.scale(raw_image, (40, 40))

    def handle_input(self, keys):
      
        if keys[pygame.K_a] and self.rect.left > 0:
            self.rect.x -= self.speed
        if keys[pygame.K_d] and self.rect.right < WIDTH:
            self.rect.x += self.speed

    def draw(self, surface):
        surface.blit(self.image, self.rect)


class Block:
    def __init__(self, x, y, size, speed, bonus=False):
        self.rect = pygame.Rect(x, y, size, size)
        self.speed = speed
        self.bonus = bonus

        if self.bonus:
            self.image = pygame.transform.scale(raw_bonus_image, (size, size))
        else:
            self.image = pygame.transform.scale(raw_enemy_image, (size, size))

    def update(self):
        self.rect.y += self.speed

    def draw(self, surface):
        surface.blit(self.image, self.rect)

    def off_screen(self):
        return self.rect.top > HEIGHT
  

def spawn_block(fall_speed):
    size = 30
    x = random.randint(0, WIDTH - size)
    bonus = random.random() < 0.15
    return Block(x, -size, size, fall_speed, bonus)


def reset_game():
    return Player(), [], 0, 0, 4.0


player, blocks, score, spawn_timer, fall_speed = reset_game()
game_over = False

running = True
while running:
    clock.tick(60)

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r and game_over:
            player, blocks, score, spawn_timer, fall_speed = reset_game()
            game_over = False

    if not game_over:
        keys = pygame.key.get_pressed()
        player.handle_input(keys)

        spawn_timer += 1
        if spawn_timer > 30:
            spawn_timer = 0
            blocks.append(spawn_block(fall_speed))
            fall_speed += 0.05

        for block in blocks[:]:
            block.update()
            if block.off_screen():
                blocks.remove(block)
                score += 3 if block.bonus else 1
            elif player.rect.colliderect(block.rect):
                blocks.remove(block)
                if block.bonus:
                    score += 5
                else:
                    game_over = True

    screen.fill(WHITE) 
    player.draw(screen)
    for block in blocks:
        block.draw(screen)
    text = font.render(f"Score: {score}", True, BLACK)
    screen.blit(text, (10, 10))

    if game_over:
        msg = big_font.render("GAME OVER", True, BLACK)
        sub = font.render("Press R to restart", True, BLACK)
        screen.blit(msg, (WIDTH // 2 - msg.get_width() // 2, HEIGHT // 2 - 40))
        screen.blit(sub, (WIDTH // 2 - sub.get_width() // 2, HEIGHT // 2 + 20))

    pygame.display.flip()