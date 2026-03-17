"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();

      if (!trimmedFirstName || !trimmedLastName) {
        toast.error("Họ và tên không được để trống hoặc chỉ chứa khoảng trắng.");
        setLoading(false);
        return;
      }

      // Kiểm tra ký tự đặc biệt cơ bản
      const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
      if (specialCharsRegex.test(trimmedFirstName) || specialCharsRegex.test(trimmedLastName)) {
        toast.error("Họ tên không được chứa ký tự đặc biệt.");
        setLoading(false);
        return;
      }

      const fullName = `${trimmedFirstName} ${trimmedLastName}`;
      await authService.register({
        email,
        password,
        fullName,
      });

      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      router.push("/login");
    } catch (error: unknown) {
      let message = "Đăng ký thất bại. Vui lòng thử lại.";
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response: { data: { message: string } } };
        if (err.response?.data?.message) {
          message = err.response.data.message;
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Đăng ký tài khoản
          </CardTitle>
          <CardDescription className="text-center">
            Nhập thông tin bên dưới để tạo tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">Họ</Label>
                <Input
                  id="first-name"
                  placeholder="Nguyễn"
                  required
                  onInvalid={(e) =>
                    (e.target as HTMLInputElement).setCustomValidity(
                      "Vui lòng nhập họ",
                    )
                  }
                  onInput={(e) =>
                    (e.target as HTMLInputElement).setCustomValidity("")
                  }
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Tên</Label>
                <Input
                  id="last-name"
                  placeholder="Văn A"
                  required
                  onInvalid={(e) =>
                    (e.target as HTMLInputElement).setCustomValidity(
                      "Vui lòng nhập tên",
                    )
                  }
                  onInput={(e) =>
                    (e.target as HTMLInputElement).setCustomValidity("")
                  }
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onInvalid={(e) =>
                  (e.target as HTMLInputElement).setCustomValidity(
                    "Vui lòng nhập email",
                  )
                }
                onInput={(e) =>
                  (e.target as HTMLInputElement).setCustomValidity("")
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                required
                onInvalid={(e) =>
                  (e.target as HTMLInputElement).setCustomValidity(
                    "Vui lòng nhập mật khẩu",
                  )
                }
                onInput={(e) =>
                  (e.target as HTMLInputElement).setCustomValidity("")
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Tạo tài khoản"
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Đăng nhập
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
